
import React, { Suspense } from 'react';

const LiteView = React.lazy(() => import('../components/dashboard/LiteView'));

const DashboardShell = () => {
    return (
        <div className="min-h-screen w-full relative overflow-x-hidden text-gray-200 font-sans selection:bg-yellow-500/30">

            {/* --- GLOBAL BACKGROUND --- */}
            <div className="fixed inset-0 z-[-1] bg-[#0b0e11]">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, #2b3139 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}
                />
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-900/10 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            {/* --- MAIN LAYOUT --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <main className="mt-8">
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center h-screen">
                            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <div className="mt-4 text-emerald-500 font-mono text-sm animate-pulse">INITIALIZING...</div>
                        </div>
                    }>
                        <LiteView />
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

export default DashboardShell;
