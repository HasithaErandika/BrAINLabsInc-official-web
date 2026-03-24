
export interface Grant {
    id: string;
    title: string;
    agency: string;
    amount?: string;
    year: string;
    description: string;
    link?: string;
}

export const grants: Grant[] = [
    {
        id: "1",
        title: "Brain-Inspired AI for Sustainable Computing",
        agency: "National Science Foundation",
        year: "2025",
        description: "Research into energy-efficient diverse AI architectures inspired by neural dynamics.",
    },
    
];
