import { Card, CardContent } from "../ui/card";

export default function TotalAmountCard ({title, amount}: { title: string, amount: number}){
    return <Card className={title === 'Remaining' ? `bg-green-200 border border-green-500 text-green-500 w-[25%]`: 'w-[25%]'}>
        <CardContent className='flex flex-col'>
            <p className="font-bold">{title}</p>
            <p>${amount}</p>
        </CardContent>
    </Card>
}