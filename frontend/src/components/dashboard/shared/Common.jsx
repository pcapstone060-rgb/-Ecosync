import React from 'react';

export const THEME = {
    colors: {
        text: 'text-white',
        subText: 'text-gray-400',
        primary: 'cyan-400',
        secondary: 'indigo-500',
        success: 'emerald-400',
        warning: 'amber-400',
        danger: 'red-500'
    }
};

export const Card = ({ children, className = '' }) => (
    <div className={`glass-panel rounded-xl p-4 shadow-xl transition-all duration-300 ${className}`}>
        {children}
    </div>
);

export const Badge = ({ children, type = 'default' }) => {
    const styles = {
        default: 'bg-gray-800 text-gray-400 border-gray-700',
        success: 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30',
        warning: 'bg-amber-900/30 text-amber-400 border-amber-500/30',
        danger: 'bg-red-900/30 text-red-400 border-red-500/30',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[type] || styles.default}`}>
            {children}
        </span>
    );
};

export const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`}></div>
);

export const StatRow = ({ label, value, unit, trend }) => (
    <div>
        <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">{label}</div>
        <div className="flex items-end gap-1">
            <div className="text-2xl font-bold text-white leading-none">{value}</div>
            <div className="text-xs text-gray-500 mb-0.5">{unit}</div>
        </div>
        {trend !== undefined && (
            <div className={`text-[10px] font-bold mt-1 ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </div>
        )}
    </div>
);
// aria-label
