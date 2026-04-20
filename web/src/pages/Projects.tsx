import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResearchLabIcon } from '@/components/ui/PageIcons';
import { Layers, Loader2, ImageOff } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { api, type PublicProject } from '@/lib/api';

export const Projects = () => {
    const [projects, setProjects] = useState<PublicProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.projects.list()
            .then(setProjects)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const getAuthorName = (p: PublicProject) =>
        p.member ? `${p.member.first_name} ${p.member.second_name}` : 'BrAIN Labs';

    return (
        <div className="min-h-screen">
            <SEO
                title="Research Projects"
                description="Explore our cutting-edge research projects at BrAIN Labs."
                keywords={['AI Research', 'BrAIN Labs Projects', 'Neuromorphic Computing', 'LLM Research']}
            />

            {/* ── Hero ─────────────────────────────────────────────── */}
            <section className="relative pt-24 md:pt-32 pb-16 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-background to-background" />
                <div className="absolute right-0 bottom-0 w-[32rem] h-[32rem] bg-primary/4 rounded-full blur-3xl" />

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-3xl lg:pl-4"
                    >
                        <div className="inline-flex items-center gap-2 bg-primary/8 text-primary px-3 py-1.5 rounded-full mb-5 border border-primary/15 text-xs font-medium uppercase tracking-wide">
                            <ResearchLabIcon size={14} />
                            Research Projects
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight tracking-tight">
                            Our{' '}
                            <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                                Research
                            </span>
                        </h1>

                        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                            Exploring the frontiers of AI through innovative research in large language models and neuromorphic computing.
                        </p>

                        {!loading && !error && (
                            <div className="mt-6 flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-foreground">{projects.length}</span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Active Projects</span>
                            </div>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* ── Projects Grid ─────────────────────────────────────── */}
            <section className="py-8 md:py-12">
                <div className="container mx-auto px-4 lg:pl-8">

                    {loading && (
                        <div className="flex items-center gap-3 text-muted-foreground py-20 justify-center">
                            <Loader2 size={20} className="animate-spin text-primary" />
                            <span className="text-sm">Loading projects…</span>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-20">
                            <p className="text-destructive text-sm">{error}</p>
                        </div>
                    )}

                    {!loading && !error && projects.length === 0 && (
                        <div className="text-center py-20">
                            <ResearchLabIcon size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground text-sm">No projects available yet.</p>
                        </div>
                    )}

                    {!loading && !error && projects.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-primary/10 rounded-xl border border-primary/15">
                                    <Layers size={18} className="text-primary" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold tracking-tight">All Projects</h2>
                                <Badge variant="secondary" className="bg-primary/8 text-primary border border-primary/15 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2.5">
                                    {projects.length} projects
                                </Badge>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl">
                                {projects.map((project, idx) => (
                                    <motion.div
                                        key={project.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.08, duration: 0.5 }}
                                        whileHover={{ y: -4 }}
                                    >
                                        <Card className="h-full border-border/50 hover:border-primary/40 hover:shadow-md transition-all duration-300 group bg-card/80">
                                            {/* Diagram image if available */}
                                            {project.project_diagram[0]?.diagram_url && (
                                                <div className="aspect-video overflow-hidden rounded-t-lg bg-muted">
                                                    <img
                                                        src={project.project_diagram[0].diagram_url}
                                                        alt={project.title}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                    />
                                                </div>
                                            )}
                                            <CardHeader className="pb-2">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2.5 group-hover:scale-150 transition-transform" />
                                                    <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors leading-snug">
                                                        {project.title}
                                                    </CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <CardDescription className="text-sm leading-relaxed pl-4">
                                                    {project.description || 'No description available.'}
                                                </CardDescription>
                                                <div className="mt-3 pl-4 text-[11px] text-muted-foreground/60">
                                                    {getAuthorName(project)}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </section>
        </div>
    );
};
