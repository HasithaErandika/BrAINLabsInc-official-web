export interface Publication {
    title: string;
    authors: string;
    venue: string;
    year: number;
    doi?: string;
    link: string;
}

export const publications: Publication[] = [
    {
        title: "Mental Stress Recognition on the Fly Using SNNs",
        authors: "M. Weerasinghe, G. Y. Wang, J. Whalley, M. Crook-Ramsey",
        venue: "Nature Scientific Reports",
        year: 2023,
        doi: "10.21203/rs.3.rs-1841009/v1",
        link: "https://doi.org/10.21203/rs.3.rs-1841009/v1"
    },
    {
        title: "Ensemble Plasticity and Network Adaptability in SNNs",
        authors: "M. Weerasinghe, D. Parry, G. Y. Wang, J. Whalley",
        venue: "ArXiv Preprint",
        year: 2023,
        link: "https://arxiv.org/abs/2203.07039"
    },
    {
        title: "Incorporating Structural Plasticity Approaches in Spiking Neural Networks for EEG Modelling",
        authors: "M. Weerasinghe, J. I. Espinosa-Ramos, G. Y. Wang, D. Parry",
        venue: "IEEE Access",
        year: 2021,
        doi: "10.1109/ACCESS.2021.3099492",
        link: "https://doi.org/10.1109/ACCESS.2021.3099492"
    }
];
