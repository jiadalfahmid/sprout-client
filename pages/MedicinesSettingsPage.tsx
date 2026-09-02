import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import Skeleton from '../components/ui/Skeleton';
import SpeedDialFAB, { SpeedDialAction } from '../components/ui/SpeedDialFAB';
import { Medicine } from '../types';
import { HiPlus, HiPencil, HiTrash, HiOutlineShoppingCart } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { useTranslation } from '../hooks/useTranslation';

const MedicinesSettingsPage: React.FC = () => {
    const { loading, medicines, familyMembers, addMedicine, updateMedicine, deleteMedicine, addToCart, cart, currency, availableCurrencies } = useAppContext();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

    const currencySymbol = useMemo(() => availableCurrencies.find(c => c.code === currency)?.symbol || '$', [currency, availableCurrencies]);

    // Form state
    const [formState, setFormState] = useState({
        memberId: familyMembers.length > 0 ? familyMembers[0].id : '',
        name: '',
        dosage: '',
        unit: 'mg',
        doseQuantity: '1',
        doseForm: 'Tablet' as 'Tablet' | 'Capsule' | 'Drops' | 'Spoon',
        stock: '',
        times: [] as string[],
        mealRelation: 'after' as 'before' | 'after',
        scheduleType: 'daily',
        stripPrice: '',
        piecesPerStrip: ''
    });
    
    const resetForm = () => {
        setFormState({
            memberId: familyMembers.length > 0 ? familyMembers[0].id : '',
            name: '',
            dosage: '',
            unit: 'mg',
            doseQuantity: '1',
            doseForm: 'Tablet',
            stock: '',
            times: [],
            mealRelation: 'after',
            scheduleType: 'daily',
            stripPrice: '',
            piecesPerStrip: ''
        });
        setEditingMedicine(null);
    };

    const handleOpenModal = (medicine: Medicine | null = null) => {
        if (medicine) {
            setEditingMedicine(medicine);
            setFormState({
                memberId: medicine.memberId,
                name: medicine.name,
                dosage: medicine.dosage.toString(),
                unit: medicine.unit,
                doseQuantity: medicine.doseQuantity.toString(),
                doseForm: medicine.doseForm,
                stock: medicine.stock.toString(),
                times: medicine.times,
                mealRelation: medicine.mealRelation,
                scheduleType: medicine.schedule.type,
                stripPrice: medicine.stripPrice?.toString() || '',
                piecesPerStrip: medicine.piecesPerStrip?.toString() || ''
            });
        } else {
            resetForm();
        }
        setModalOpen(true);
    };

    const handleSaveMedicine = () => {
        // Basic validation
        if (!formState.memberId || !formState.name || !formState.dosage || !formState.stock || !formState.doseQuantity || formState.times.length === 0) {
            toast.error(t('medicines.modal.fillFieldsError'));
            return;
        }

        const medicineData = {
            memberId: formState.memberId,
            name: formState.name,
            dosage: parseFloat(formState.dosage),
            unit: formState.unit,
            doseQuantity: parseInt(formState.doseQuantity),
            doseForm: formState.doseForm,
            stock: parseInt(formState.stock),
            times: formState.times,
            mealRelation: formState.mealRelation,
            schedule: { type: formState.scheduleType as 'daily' | 'alternate_days' },
            stripPrice: formState.stripPrice ? parseFloat(formState.stripPrice) : undefined,
            piecesPerStrip: formState.piecesPerStrip ? parseInt(formState.piecesPerStrip) : undefined,
        };

        if (editingMedicine) {
            updateMedicine({ ...editingMedicine, ...medicineData });
            toast.success(t('medicines.modal.updated'));
        } else {
            addMedicine(medicineData as Omit<Medicine, 'id' | 'history'>);
            toast.success(t('medicines.modal.added'));
        }
        setModalOpen(false);
        resetForm();
    };
    
    const handleAddToCart = (medicineId: string) => {
        addToCart({ medicineId, strips: 1, pieces: 0 });
        toast.success(t('medicines.addedToCart'));
    }

    const renderSkeleton = () => (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
            <Card key={i}>
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>
            </Card>
        ))}
      </div>
    );

    const fabActions: SpeedDialAction[] = [
        {
            id: 'add_medicine',
            label: t('medicines.add') || 'Add Medicine',
            icon: HiPlus,
            color: 'blue',
            onClick: () => handleOpenModal(),
        },
        {
            id: 'view_cart',
            label: `${t('medicines.cart') || 'Cart'} (${cart.length})`,
            icon: HiOutlineShoppingCart,
            color: 'orange',
            onClick: () => navigate('/restock'),
        },
    ];

    return (
        <div>
            <PageHeader
                title={t('medicines.title')}
                action={
                    <div className="flex items-center gap-2">
                        {cart.length > 0 && 
                            <button onClick={() => navigate('/restock')} className="px-3 py-2 sm:px-3.5 sm:py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap shadow-xs">
                                <HiOutlineShoppingCart className="h-4 w-4" />
                                {t('medicines.cart')} ({cart.length})
                            </button>
                        }
                        <button onClick={() => handleOpenModal()} className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm text-xs sm:text-sm whitespace-nowrap">
                            <HiPlus className="h-4 w-4" /> {t('medicines.add')}
                        </button>
                    </div>
                }
            />

            {loading ? renderSkeleton() : (
                <div className="space-y-4">
                    {medicines.map((med, index) => {
                        const member = familyMembers.find(m => m.id === med.memberId);
                        const stockLevel = med.stock <= 10 ? 'text-red-400' : med.stock <= 20 ? 'text-yellow-400' : 'text-green-400';
                        return (
                            <motion.div key={med.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                                <Card>
                                    <div className="flex justify-between items-start group">
                                        <div>
                                            <h3 className="text-lg font-bold text-light-text-primary dark:text-text-primary">{med.name}</h3>
                                            <p className="text-sm text-light-text-secondary dark:text-text-secondary">{t('medicines.for')}: {member?.name || 'Unknown'}</p>
                                            <p className="text-sm text-light-text-secondary dark:text-text-secondary">{med.dosage}{med.unit} ({med.doseQuantity} {med.doseForm}), {med.times.join(', ')}</p>
                                            <p className={`font-semibold mt-2 ${stockLevel}`}>{t('medicines.stock', { count: med.stock })}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                <button onClick={() => handleOpenModal(med)} className="text-blue-400 hover:text-blue-300"><HiPencil className="h-5 w-5"/></button>
                                                <button onClick={() => deleteMedicine(med.id)} className="text-red-400 hover:text-red-300"><HiTrash className="h-5 w-5"/></button>
                                            </div>
                                            <button onClick={() => handleAddToCart(med.id)} className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-xl text-primary hover:bg-primary/20"><HiOutlineShoppingCart className="h-5 w-5" /></button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingMedicine ? t('medicines.modal.editTitle') : t('medicines.modal.addTitle')}>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                     <div>
                        <label htmlFor="memberId" className="text-sm font-medium text-light-text-secondary dark:text-text-secondary">{t('medicines.modal.member')}</label>
                        <select id="memberId" value={formState.memberId} onChange={e => setFormState(s => ({...s, memberId: e.target.value}))} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600">
                            {familyMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label htmlFor="medName" className="text-sm font-medium text-light-text-secondary dark:text-text-secondary">{t('medicines.modal.name')}</label>
                        <input id="medName" type="text" placeholder="e.g. Paracetamol" value={formState.name} onChange={e => setFormState(s => ({...s, name: e.target.value}))} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600" />
                     </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor="dosage" className="text-sm font-medium text-light-text-secondary dark:text-text-secondary">{t('medicines.modal.dosage')}</label>
                            <input id="dosage" type="number" placeholder="e.g. 500" value={formState.dosage} onChange={e => setFormState(s => ({...s, dosage: e.target.value}))} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600" />
                        </div>
                        <div>
                            <label htmlFor="unit" className="text-sm font-medium text-light-text-secondary dark:text-text-secondary">{t('medicines.modal.unit')}</label>
                            <input id="unit" type="text" placeholder="e.g. mg, ml" value={formState.unit} onChange={e => setFormState(s => ({...s, unit: e.target.value}))} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                           <label htmlFor="doseQuantity" className="text-sm font-medium text-light-text-secondary dark:text-text-secondary">{t('medicines.modal.quantity')}</label>
                           <input id="doseQuantity" type="number" placeholder="e.g. 1" value={formState.doseQuantity} onChange={e => setFormState(s => ({...s, doseQuantity: e.target.value}))} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600" />
                        </div>
                        <div>
                           <label htmlFor="doseForm" className="text-sm font-medium text-light-text-secondary dark:text-text-secondary">{t('medicines.modal.form')}</label>
                           <select id="doseForm" value={formState.doseForm} onChange={e => setFormState(s => ({...s, doseForm: e.target.value as any}))} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600">
                               <option value="Tablet">{t('medicines.forms.tablet')}</option>
                               <option value="Capsule">{t('medicines.forms.capsule')}</option>
                               <option value="Drops">{t('medicines.forms.drops')}</option>
                               <option value="Spoon">{t('medicines.forms.spoon')}</option>
                           </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="stock" className="text-sm font-medium text-light-text-secondary dark:text-text-secondary">{t('medicines.modal.currentStock')}</label>
                        <input id="stock" type="number" placeholder="e.g. 30" value={formState.stock} onChange={e => setFormState(s => ({...s, stock: e.target.value}))} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600" />
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-light-text-secondary dark:text-text-secondary block mb-1">{t('medicines.modal.intakeTime')}</label>
                        <div className="flex justify-around p-2 bg-light-background dark:bg-background rounded-lg border border-slate-200 dark:border-slate-600">
                            {['Morning', 'Noon', 'Night'].map(timeOfDay => {
                                const timeValue = timeOfDay === 'Morning' ? '08:00' : timeOfDay === 'Noon' ? '14:00' : '20:00';
                                const isChecked = formState.times.includes(timeValue);
                                return (
                                    <label key={timeOfDay} className={`cursor-pointer px-4 py-2 rounded-md text-sm font-semibold transition-colors ${isChecked ? 'bg-primary text-white shadow' : 'hover:bg-primary/10'}`}>
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={isChecked}
                                            onChange={() => {
                                                const newTimes = isChecked
                                                    ? formState.times.filter(t => t !== timeValue)
                                                    : [...formState.times, timeValue];
                                                setFormState(s => ({ ...s, times: newTimes.sort() }));
                                            }}
                                        />
                                        {t(`medicines.modal.${timeOfDay.toLowerCase()}`)}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-light-text-secondary dark:text-text-secondary block mb-1">{t('medicines.modal.mealRelation')}</label>
                        <div className="flex justify-around p-1 bg-light-background dark:bg-background rounded-lg border border-slate-200 dark:border-slate-600">
                            <button
                                type="button"
                                onClick={() => setFormState(s => ({...s, mealRelation: 'before'}))}
                                className={`w-1/2 py-2 rounded-md font-semibold transition-colors text-sm ${formState.mealRelation === 'before' ? 'bg-primary text-white shadow' : 'hover:bg-primary/10'}`}
                            >
                                {t('medicines.modal.beforeMeal')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormState(s => ({...s, mealRelation: 'after'}))}
                                className={`w-1/2 py-2 rounded-md font-semibold transition-colors text-sm ${formState.mealRelation === 'after' ? 'bg-primary text-white shadow' : 'hover:bg-primary/10'}`}
                            >
                                {t('medicines.modal.afterMeal')}
                            </button>
                        </div>
                    </div>
                    
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor="stripPrice" className="text-sm font-medium text-light-text-secondary dark:text-text-secondary">{t('medicines.modal.pricePerStrip')} ({currencySymbol}) ({t('medicines.modal.optional')})</label>
                            <input id="stripPrice" type="number" placeholder="e.g. 150" value={formState.stripPrice} onChange={e => setFormState(s => ({...s, stripPrice: e.target.value}))} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600" />
                        </div>
                        <div>
                            <label htmlFor="piecesPerStrip" className="text-sm font-medium text-light-text-secondary dark:text-text-secondary">{t('medicines.modal.piecesPerStrip')} ({t('medicines.modal.optional')})</label>
                            <input id="piecesPerStrip" type="number" placeholder="e.g. 10" value={formState.piecesPerStrip} onChange={e => setFormState(s => ({...s, piecesPerStrip: e.target.value}))} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600" />
                        </div>
                    </div>
                    <button onClick={handleSaveMedicine} className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 mt-2">{editingMedicine ? t('finance.modal.saveChanges') : t('medicines.add')}</button>
                </div>
            </Modal>

            {/* SPEED DIAL FLOATING ACTION BUTTON */}
            <SpeedDialFAB
                actions={fabActions}
                mainLabel="Medicine Actions"
            />
        </div>
    );
};

export default MedicinesSettingsPage;
