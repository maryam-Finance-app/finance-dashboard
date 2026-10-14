import { Card, CardContent } from "../ui/card";

export default function TotalAmountCard ({title, amount}: { title: string, amount: number}){
    return <Card className={title === 'Remaining' ? `bg-green-200 border border-green-500 text-green-500`: ''}>
        <CardContent className='flex flex-col'>
            <h5>{title}</h5>
            <p>${amount}</p>
        </CardContent>
    </Card>
}