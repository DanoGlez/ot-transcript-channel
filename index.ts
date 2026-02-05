import {api, opendiscord, utilities} from "#opendiscord"
import * as discord from "discord.js"
import * as fs from "fs"
import * as path from "path"

if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

// Tipos para la configuración de opciones
interface OptionConfig {
    id: string
    transcriptId?: string
    [key: string]: unknown
}

// Cache de la configuración
let optionsCache: OptionConfig[] | null = null
let lastCacheTime = 0
const CACHE_TTL = 60000

// Cargar la configuración de options.json
const getOptionsConfig = (): OptionConfig[] => {
    const now = Date.now()
    if (optionsCache && (now - lastCacheTime) < CACHE_TTL) {
        return optionsCache
    }
    
    try {
        const optionsPath = path.join(process.cwd(), "config", "options.json")
        const rawData = fs.readFileSync(optionsPath, "utf8")
        optionsCache = JSON.parse(rawData) as OptionConfig[]
        lastCacheTime = now
        return optionsCache
    } catch (err) {
        opendiscord.log("ot-transcript-channel: Error loading options.json", "error")
        return []
    }
}

// Obtener el transcriptId para una opción específica
const getTranscriptChannelId = (optionId: string): string | null => {
    const options = getOptionsConfig()
    const option = options.find(opt => opt.id === optionId)
    return option?.transcriptId ?? null
}

// Inyectar worker adicional en la action de transcript
opendiscord.events.get("afterActionsLoaded").listen(async (actions) => {
    const transcriptAction = actions.get("opendiscord:create-transcript")
    if (!transcriptAction) return
    
    transcriptAction.workers.add(new api.ODWorker("ot-transcript-channel:send-to-channel", -1, async (instance, params) => {
        const {channel, user, ticket} = params
        
        if (!instance.success || !instance.result) return
        
        const optionId = ticket.option.id.value
        const transcriptChannelId = getTranscriptChannelId(optionId)
        if (!transcriptChannelId) return
        
        opendiscord.log("ot-transcript-channel: Sending transcript to " + transcriptChannelId, "plugin")
        
        const mainServer = opendiscord.client.mainServer
        if (!mainServer) {
            opendiscord.log("ot-transcript-channel: No main server found", "error")
            return
        }
        
        const transcriptChannel = await opendiscord.client.fetchGuildChannel(mainServer, transcriptChannelId)
        if (!transcriptChannel || !transcriptChannel.isTextBased()) {
            opendiscord.log("ot-transcript-channel: Channel not found", "error")
            return
        }
        
        try {
            // Obtener configuraciones igual que el sistema original
            const transcriptConfig = opendiscord.configs.get("opendiscord:transcripts")
            const generalConfig = opendiscord.configs.get("opendiscord:general")
            const lang = opendiscord.languages
            const mode = transcriptConfig.data.general.mode
            
            // Crear el embed igual que "opendiscord:transcript-html-ready" o "opendiscord:transcript-text-ready"
            const embed = new discord.EmbedBuilder()
            
            // Color (igual que el original)
            const embedColor = transcriptConfig.data.embedSettings.customColor 
                ? transcriptConfig.data.embedSettings.customColor 
                : generalConfig.data.mainColor
            embed.setColor(embedColor as discord.ColorResolvable)
            
            // Título con emoji (igual que el original)
            embed.setTitle(utilities.emojiTitle("📄", lang.getTranslation("transcripts.success.ready")))
            embed.setTimestamp(new Date())
            
            // Campo Ticket
            embed.addFields({
                name: lang.getTranslation("params.uppercase.ticket") + ":",
                value: "#" + channel.name,
                inline: false
            })
            
            // URL del transcript (solo HTML)
            if (mode === "html" && instance.result.data && "url" in instance.result.data) {
                const transcriptUrl = instance.result.data.url as string
                if (transcriptUrl) {
                    embed.setURL(transcriptUrl)
                }
            }
            
            // Creador (igual que el original)
            const creatorId = ticket.get("opendiscord:opened-by").value
            if (creatorId) {
                try {
                    const creator = await channel.client.users.fetch(creatorId)
                    embed.addFields({
                        name: lang.getTranslation("params.uppercase.creator") + ":",
                        value: creator.username + " (" + discord.userMention(creator.id) + ")"
                    })
                    embed.setThumbnail(creator.displayAvatarURL())
                } catch {}
            }
            
            // Descripción según el modo (igual que el original)
            const modeText = mode === "html" 
                ? lang.getTranslation("params.lowercase.html")
                : lang.getTranslation("params.lowercase.text")
            embed.setDescription(lang.getTranslationWithParams("transcripts.success.createdChannel", [modeText]))
            
            // Crear componentes (botón Ver transcripción)
            const components: discord.ActionRowBuilder<discord.ButtonBuilder>[] = []
            
            if (mode === "html" && instance.result.data && "url" in instance.result.data) {
                const transcriptUrl = instance.result.data.url as string
                if (transcriptUrl) {
                    const button = new discord.ButtonBuilder()
                        .setLabel(lang.getTranslation("actions.buttons.viewTranscript") ?? "Transcripts")
                        .setStyle(discord.ButtonStyle.Link)
                        .setURL(transcriptUrl)
                    
                    const row = new discord.ActionRowBuilder<discord.ButtonBuilder>()
                        .addComponents(button)
                    
                    components.push(row)
                }
            }
            
            // Enviar al canal personalizado
            await (transcriptChannel as discord.TextChannel).send({ 
                embeds: [embed],
                components: components.length > 0 ? components : undefined
            })
            opendiscord.log("ot-transcript-channel: Transcript sent!", "plugin")
            
        } catch (err) {
            opendiscord.log("ot-transcript-channel: Error - " + String(err), "error")
        }
    }))
})

opendiscord.log("ot-transcript-channel: Plugin loaded!", "plugin")