import { ReactNode } from "react";

export function SimulationLayout({
    timeline,
    stats,
    workspace
}: {
    timeline: ReactNode;
    stats: ReactNode;
    workspace: ReactNode;
}) {
    return (
        <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
            {/* Left Sidebar: Timeline */}
            <aside className="w-auto h-full z-10 shadow-xl">
                {timeline}
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full relative">
                {/* Top Bar: Stats */}
                <header className="h-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center px-8 z-10 justify-between">
                    <div className="text-lg font-bold tracking-tight text-white/90">
                        ZENITH <span className="text-slate-600 font-normal">/ Point Blank</span>
                    </div>
                    {stats}
                </header>

                {/* Workspace Area */}
                <div className="flex-1 p-6 overflow-hidden relative">
                    {/* Background Grid Decoration */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                    <div className="relative h-full z-0">
                        {workspace}
                    </div>
                </div>
            </main>
        </div>
    );
}
