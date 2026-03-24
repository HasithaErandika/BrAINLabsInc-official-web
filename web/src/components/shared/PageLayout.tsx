import React from 'react';
import { Outlet } from 'react-router-dom';
import { CursorEffect } from '@/components/ui/CursorEffect';
import { ProfessionalBackground } from '@/components/ui/ProfessionalBackground';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const PageLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative">
            <CursorEffect />
            <ProfessionalBackground />
            <Navbar />
            <main className="flex-1 pt-20 relative z-10"> 
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};
