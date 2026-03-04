export const EventListSchema = {
    title: 'Events',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.reason', label: 'Reason' },
        { key: 'extra.message', label: 'Message' },
        { key: 'extra.source', label: 'Source' },
        { key: 'extra.involvedObject', label: 'Objects' },
        { key: 'extra.count', label: 'Count' },
        { key: 'extra.firstTimestamp', label: 'First Seen' },
        { key: 'extra.lastTimestamp', label: 'Last Seen' },
    ],
};
