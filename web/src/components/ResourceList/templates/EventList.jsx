export const EventListSchema = {
    title: 'Events',
    cols: [
        { key: 'extra.last-seen', label: 'Last Seen' },
        { key: 'extra.type', label: 'Type', badge: true },
        { key: 'extra.reason', label: 'Reason' },
        { key: 'extra.object', label: 'Object' },
        { key: 'extra.message', label: 'Message' },
    ],
};
