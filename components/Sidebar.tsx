'use client';

import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
    children: ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    side: 'left' | 'right';
    title?: string;
    icon?: ReactNode;
    collapsedContent?: ReactNode;
}

export default function Sidebar({
    children,
    isOpen,
    onToggle,
    side,
    title,
    icon,
    collapsedContent,
}: SidebarProps) {
    return (
        <div
            className={`
        relative flex-shrink-0 border-gray-700 bg-[#1a1a1a] transition-all duration-300 ease-in-out
        ${side === 'left' ? 'border-r' : 'border-l'}
        ${isOpen ? 'w-80' : 'w-16'}
      `}
        >
            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className={`
          absolute top-3 z-20 p-1.5 rounded-lg bg-[#333] hover:bg-[#444] text-gray-400 hover:text-white
          transition-all border border-gray-600/50 shadow-lg
          ${side === 'left' ? '-right-3' : '-left-3'}
        `}
                aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
                {side === 'left' ? (
                    isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                ) : (
                    isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
                )}
            </button>

            {/* Header */}
            {title && (
                <div className={`
          flex items-center gap-2 p-4 border-b border-gray-700/50
          ${isOpen ? '' : 'justify-center'}
        `}>
                    {icon && (
                        <div className="p-2 rounded-lg bg-[#b82c3b]/20 flex-shrink-0">
                            {icon}
                        </div>
                    )}
                    {isOpen && (
                        <h2 className="text-sm font-semibold text-white truncate">{title}</h2>
                    )}
                </div>
            )}

            {/* Content */}
            <div className={`
        h-[calc(100%-60px)] overflow-hidden
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        transition-opacity duration-200
      `}>
                <div className="h-full overflow-y-auto p-4">
                    {children}
                </div>
            </div>

            {/* Collapsed Content (icons/shortcuts) */}
            {!isOpen && collapsedContent && (
                <div className="p-2 space-y-2 animate-fade-in">
                    {collapsedContent}
                </div>
            )}
        </div>
    );
}

// Tooltip wrapper for collapsed state icons
interface SidebarIconButtonProps {
    icon: ReactNode;
    label: string;
    onClick?: () => void;
    isActive?: boolean;
}

export function SidebarIconButton({ icon, label, onClick, isActive }: SidebarIconButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`
        relative group w-full p-3 rounded-xl flex items-center justify-center
        transition-all
        ${isActive
                    ? 'bg-[#b82c3b]/20 text-[#ff6b7a]'
                    : 'hover:bg-[#333] text-gray-400 hover:text-white'
                }
      `}
            aria-label={label}
        >
            {icon}
            {/* Tooltip */}
            <div className="
        absolute left-full ml-2 px-2 py-1 bg-[#333] text-white text-xs rounded-md
        opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity
        whitespace-nowrap z-50 border border-gray-600/50 shadow-lg
      ">
                {label}
            </div>
        </button>
    );
}
