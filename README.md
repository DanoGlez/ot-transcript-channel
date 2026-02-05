# Transcript Channel

Send ticket transcripts to specific Discord channels based on ticket option configuration.

## Features

- ✅ Per-option transcript channel configuration
- ✅ Sends transcript info when ticket is deleted
- ✅ Clean embed with ticket details
- ✅ Direct link button to transcript
- ✅ Works alongside the global transcript channel
- ✅ Uses Open Ticket translation system
- ✅ Zero additional configuration files needed

## Usage

1. Add `transcriptId` field to any ticket option in `config/options.json`
2. The plugin will automatically send transcripts to that channel when tickets are deleted

## Configuration

Add the `transcriptId` field to any option in `config/options.json`:

```json
{
    "id": "soporte",
    "transcriptId": "1234567890123456789",
    "name": "Ticket de Soporte",
    "type": "ticket",
    ...
}
```

### Property

| Field | Type | Description |
|-------|------|-------------|
| `transcriptId` | `string` | Discord channel ID where transcripts for this option will be sent |

## Usage Examples

### Basic Configuration
```json
{
    "id": "soporte",
    "transcriptId": "1234567890123456789",
    "name": "Soporte",
    "type": "ticket",
    "button": {
        "emoji": "📩",
        "label": "Ayuda",
        "color": "blue"
    },
    ...
}
```

### Multiple Options with Different Channels
```json
[
    {
        "id": "soporte",
        "transcriptId": "1111111111111111111",
        "name": "Soporte",
        "type": "ticket",
        ...
    },
    {
        "id": "reportes",
        "transcriptId": "2222222222222222222",
        "name": "Reportes",
        "type": "ticket",
        ...
    },
    {
        "id": "general",
        "name": "General",
        "type": "ticket",
        ...
    }
]
```

> In this example:
> - `soporte` tickets → sent to channel `1111111111111111111`
> - `reportes` tickets → sent to channel `2222222222222222222`
> - `general` tickets → only sent to global transcript channel (no `transcriptId`)

### Without transcriptId
```json
{
    "id": "general",
    "name": "General",
    "type": "ticket",
    ...
}
```
Options without `transcriptId` will only use the global transcript channel configured in `config/transcripts.json`.

## Embed Preview

When a transcript is generated, the plugin sends an embed **identical to the official transcript embed**, using the Open Ticket translation system. The embed will be displayed in the language configured in `config/general.json`.

The embed includes:
- 📄 Translated title ("Transcript Ready" / "Transcript Listo" / etc.)
- Ticket name
- Creator info with avatar
- "View Transcript" button (HTML mode only)
- Timestamp

## Notes

> ⚠️ **This plugin has only been tested with HTML transcript mode.** Text mode may work but is not officially supported.

- The global transcript channel in `config/transcripts.json` still works normally
- This plugin **adds** additional channels, it doesn't replace the global one
- If an option doesn't have `transcriptId`, nothing extra happens

## Requirements

- Open Ticket v4.1.0+
- Transcript system enabled
- HTML transcript mode (recommended)

## Author

DanoGlez