import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { HiArrowLeft, HiArrowDownTray, HiCheckCircle } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';

type RestockStep = 'cart' | 'list';

const RestockPage: React.FC = () => {
    const { cart, medicines, updateCartItemQuantity, completeRestock, currency, availableCurrencies } = useAppContext();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [step, setStep] = useState<RestockStep>('cart');

    const currencySymbol = useMemo(() => availableCurrencies.find(c => c.code === currency)?.symbol || '$', [currency, availableCurrencies]);

    const cartDetails = useMemo(() => {
        return cart.map(item => {
            const medicine = medicines.find(m => m.id === item.medicineId);
            if (!medicine) return null;

            const pricePerPiece = (medicine.stripPrice && medicine.piecesPerStrip) ? (medicine.stripPrice / medicine.piecesPerStrip) : 0;
            const totalPieces = (item.strips * (medicine.piecesPerStrip || 0)) + item.pieces;
            const itemTotal = totalPieces * pricePerPiece;

            return { ...item, medicine, itemTotal, pricePerPiece };
        }).filter(Boolean);
    }, [cart, medicines]);

    const grandTotal = useMemo(() => {
        return cartDetails.reduce((acc, item) => acc + (item?.itemTotal || 0), 0);
    }, [cartDetails]);

    const handleDownloadCsv = () => {
        let csvContent = `data:text/csv;charset=utf-8,Medicine Name,Strips,Pieces,Total Pieces,Price (${currencySymbol})\n`;
        cartDetails.forEach(item => {
            if (item) {
                const totalPieces = (item.strips * (item.medicine.piecesPerStrip || 0)) + item.pieces;
                csvContent += `${item.medicine.name},${item.strips},${item.pieces},${totalPieces},${item.itemTotal.toFixed(2)}\n`;
            }
        });
        csvContent += `, , ,Total,${grandTotal.toFixed(2)}\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "medicine_shopping_list.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t('restock.downloaded'));
    };
    
    const handleDone = () => {
        completeRestock();
        toast.success(t('restock.stockUpdated'));
        navigate('/settings/medicines');
    }

    if (cart.length === 0 && step === 'cart') {
        return (
             <div className="text-center">
                <p className="text-light-text-secondary dark:text-text-secondary">{t('restock.emptyCart')}</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary font-semibold">{t('restock.goBack')}</button>
            </div>
        )
    }

    return (
        <div>
             <div className="flex items-center gap-4 mb-6">
                <button onClick={() => step === 'cart' ? navigate(-1) : setStep('cart')} aria-label={step === 'cart' ? 'Go back' : 'Back to cart'} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 transition">
                    <HiArrowLeft className="h-6 w-6"/>
                </button>
                <PageHeader 
                    title={step === 'cart' ? t('restock.cartTitle') : t('restock.listTitle')}
                    className="!mb-0 flex-1"
                />
             </div>
             
            {step === 'cart' ? (
                <div className="space-y-4">
                    <Card>
                        <ul className="divide-y divide-slate-200 dark:divide-zinc-700">
                            {cartDetails.map(item => item && (
                                <li key={item.medicineId} className="py-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-light-text-primary dark:text-text-primary">{item.medicine.name}</p>
                                            <p className="text-xs text-light-text-secondary dark:text-text-secondary">{currencySymbol}{item.pricePerPiece.toFixed(2)}{t('restock.perPiece')}</p>
                                        </div>
                                        <p className="font-bold text-lg text-light-text-primary dark:text-text-primary">{currencySymbol}{item.itemTotal.toFixed(2)}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">{t('restock.strips')}</label>
                                            <input type="number" min="0" value={item.strips} onChange={e => updateCartItemQuantity(item.medicineId, parseInt(e.target.value) || 0, item.pieces)} className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">{t('restock.pieces')}</label>
                                            <input type="number" min="0" value={item.pieces} onChange={e => updateCartItemQuantity(item.medicineId, item.strips, parseInt(e.target.value) || 0)} className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"/>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Card>
                     <Card className="flex justify-between items-center">
                        <p className="font-semibold">{t('restock.totalPrice')}</p>
                        <p className="text-2xl font-bold text-primary">{currencySymbol}{grandTotal.toFixed(2)}</p>
                    </Card>
                    <button onClick={() => setStep('list')} className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-opacity-90 shadow-md active:scale-[0.99] transition-colors text-sm">
                        {t('restock.generateList')}
                    </button>
                </div>
             ) : (
                <div className="space-y-4">
                    <Card>
                        <p className="text-center text-light-text-secondary dark:text-text-secondary mb-4">{t('restock.listReady')}</p>
                         <ul className="divide-y divide-slate-200 dark:divide-zinc-700">
                           {cartDetails.map(item => item && (
                               <li key={item.medicineId} className="py-3 flex justify-between items-center">
                                  <div>
                                       <p className="font-semibold text-light-text-primary dark:text-text-primary">{item.medicine.name}</p>
                                       <p className="text-sm text-light-text-secondary dark:text-text-secondary">
                                        {item.strips > 0 && `${item.strips} strip(s)`}
                                        {item.strips > 0 && item.pieces > 0 && ', '}
                                        {item.pieces > 0 && `${item.pieces} piece(s)`}
                                       </p>
                                  </div>
                                  <p className="font-semibold text-light-text-primary dark:text-text-primary">{currencySymbol}{item.itemTotal.toFixed(2)}</p>
                               </li>
                           ))}
                            <li className="py-3 flex justify-between items-center font-bold text-lg">
                                <p>{t('restock.total')}</p>
                                <p>{currencySymbol}{grandTotal.toFixed(2)}</p>
                            </li>
                        </ul>
                    </Card>
                    <div className="grid grid-cols-2 gap-4">
                         <button onClick={handleDownloadCsv} className="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
                           <HiArrowDownTray className="h-5 w-5"/> {t('restock.download')}
                         </button>
                         <button onClick={handleDone} className="w-full py-3 bg-primary text-white font-semibold rounded-lg flex items-center justify-center gap-2">
                           <HiCheckCircle className="h-5 w-5"/> {t('restock.finishRestock')}
                         </button>
                    </div>
                </div>
             )}
        </div>
    )
}

export default RestockPage;
