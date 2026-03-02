export const EventListSchema = {
    title: 'Events',
    cols: [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'namespace', label: 'Namespace', sortable: true },
        { key: 'extra.reason', label: 'Reason' },
        { key: 'extra.message', label: 'Message' },
        { key: 'extra.source', label: 'Source' },
        { key: 'extra.object', label: 'Objects' },
        { key: 'extra.count', label: 'Count', align: 'center' },
        { key: 'extra.first-seen', label: 'First Seen', align: 'right' },
        { key: 'extra.last-seen', label: 'Last Seen', align: 'right' },
    ],
};
