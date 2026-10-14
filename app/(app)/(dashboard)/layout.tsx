'use client';
import TransactionForm from "@/components/transactions/transaction-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useTransactions } from "@/hooks/useTransactions";
import { PlusIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";

export default function DashboardLayout({children}: {children: React.ReactNode}){

    const pathname = usePathname();

    const title = pathname === '/' ? 'Transactions': 'Analytics';
    const description = pathname === '/'? 
    'Track your income, expenses and savings in one place.'
    : 'See where your money comes from and where it goes.'

    const {data: transactions, isLoading, isError} = useTransactions();
    const isEmpty = !!transactions && transactions.total === 0;

    return (
        <>
            <div>
                <h1 className="text-2xl font-semibold">{title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            {isError && <div className="flex justify-center items-center h-screen">SomeThing went wrong. Please Try again later!</div>}
            {isLoading && <div className="flex justify-center items-center h-screen">Loading data...</div>}
            {isEmpty && <div className="flex justify-center items-center h-screen">No data available.</div>}
            {transactions && !isEmpty && <>
            <div className="mt-5 mb-3">cards</div>
                {children}
            </>
            }
            <Dialog>
                <DialogTrigger render={<Button>
                    <PlusIcon />
                </Button>} className={'rounded-full p-3 absolute bottom-0 right-0 mb-6 mr-8 w-fit h-fit cursor-pointer'}/>
                <TransactionForm title="Add Transaction"/>
            </Dialog>
        </>
    )
}