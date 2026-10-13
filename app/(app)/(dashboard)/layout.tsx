'use client';
import { usePathname } from "next/navigation";
import React from "react";

export default function DashboardLayout({children}: {children: React.ReactNode}){

    const pathname = usePathname();

    const title = pathname === '/' ? 'Transactions': 'Analytics';
    const description = pathname === '/'? 
    'Track your income, expenses and savings in one place.'
    : 'See where your money comes from and where it goes.'

    return (
        <>
            <div>
                <div>
                <h1 className="text-2xl font-semibold">{title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
                <div className="mt-5 mb-3">cards</div>
            </div>
            {children}
        </>
    )
}