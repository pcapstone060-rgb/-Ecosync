import React from 'react';

// --- THEME CONSTANTS ---
export const THEME = {
    colors: {
        bg: "bg-[#0b0e11]", // Very dark blue/black (Binance style)
        card: "bg-[#181a20]", // Slightly lighter card bg
        cardHover: "hover:bg-[#2b3139]",
        primary: "text-[#FCD535]", // Binance Yellow-ish
        success: "text-[#0ECB81]", // Binance Green
        danger: "text-[#F6465D]", // Binance Red
        text: "text-[#EAECEF]",
        subText: "text-[#848E9C]",
        border: "border-[#25282e]"
    }
};

// --- COMPONENTS ---

export const Card = ({ children, className = "", noPadding = false }) => (
    <div className={`${THEME.colors.card} rounded-xl border ${THEME.colors.border} shadow-lg overflow-hidden transition-all duration-200 ${className}`}>
        <div className={noPadding ? "" : "p-5"}>
            {children}
        </div>
    </div>
);

export const Badge = ({ type = "neutral", children }) => {
    let styles = "bg-gray-800 text-gray-400";
    if (type === "success") styles = "bg-[#0ECB81]/10 text-[#0ECB81]";
    if (type === "warning") styles = "bg-[#FCD535]/10 text-[#FCD535]";
    if (type === "danger") styles = "bg-[#F6465D]/10 text-[#F6465D]";
    if (type === "info") styles = "bg-blue-500/10 text-blue-400";

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${styles}`}>
            {children}
        </span>
    );
};

export const Skeleton = ({ className = "" }) => (
    <div className={`animate-pulse bg-[#2b3139] rounded ${className}`} />
);

export const StatRow = ({ label, value, unit, subValue, trend }) => (
    <div className="flex justify-between items-end mb-2">
        <div>
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${THEME.colors.subText}`}>{label}</p>
            <div className="flex items-baseline mt-1">
                <span className={`text-2xl font-bold font-mono ${THEME.colors.text}`}>{value}</span>
                {unit && <span className={`text-xs ml-1 ${THEME.colors.subText}`}>{unit}</span>}
            </div>
        </div>
        <div className="text-right">
            {trend && (
                <div className={`text-xs font-medium ${trend > 0 ? THEME.colors.success : THEME.colors.danger}`}>
                    {trend > 0 ? "+" : ""}{trend}%
                </div>
            )}
            {subValue && <div className={`text-[10px] ${THEME.colors.subText}`}>{subValue}</div>}
        </div>
    </div>
);
// aria-label
