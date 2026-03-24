export interface Event {
    title: string;
    type: string;
    date: string;
    description: string;
    link?: string;
}

export const pastEvents: Event[] = [
    {
        title: "TinyML: A Compact Revolution in Engineering AI",
        type: "Pre-Conference Workshop",
        date: "August 2025",
        description: "MERCon (Moratuwa Engineering Research Conference)",
        link: "https://tinyml-in-action.github.io"
    },
    {
        title: "All Roads Lead to TinyML: The Rome of Efficient Machine Learning in Engineering",
        type: "Pre-Conference Workshop",
        date: "August 2025",
        description: "SICET (SLIIT International Conference on Engineering and Technology)",
        link: "https://tinyml-in-action.github.io"
    }
];

export const upcomingEvents: Event[] = [];

export const eventResources = {
    title: "TinyML Workshops",
    description: "Find recordings, materials, and workshop details at:",
    link: "https://tinyml-in-action.github.io"
};
