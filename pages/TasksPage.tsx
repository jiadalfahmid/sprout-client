import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import SpeedDialFAB, { SpeedDialAction } from '../components/ui/SpeedDialFAB';
import { Task, TaskList as ITaskList } from '../types';
import { HiOutlineTrash, HiPlus, HiOutlineCalendarDays, HiOutlineQueueList, HiOutlineCheckBadge } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import Skeleton from '../components/ui/Skeleton';
import { useTranslation } from '../hooks/useTranslation';

// This component will manage a single task list
const TaskListCard: React.FC<{
  list: ITaskList;
  tasks: Task[];
  onAddTask: (listId: string, content: string, dueDate?: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDeleteList: (list: ITaskList) => void;
}> = ({ list, tasks, onAddTask, onToggleTask, onDeleteTask, onDeleteList }) => {
  const [newItem, setNewItem] = useState('');
  const [showDueDate, setShowDueDate] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const dueDateInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleAddTask = () => {
    if (newItem.trim()) {
      onAddTask(
        list.id,
        newItem.trim(),
        newDueDate ? new Date(newDueDate).toISOString() : undefined
      );
      setNewItem('');
      setNewDueDate('');
      setShowDueDate(false);
    }
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
  }, [tasks]);

  return (
    <div className="bg-light-surface dark:bg-surface rounded-2xl shadow-lg p-4 border border-slate-200 dark:border-zinc-700/50 break-inside-avoid mb-6 flex flex-col h-full">
      <h2 className="text-xl font-semibold text-light-text-primary dark:text-text-primary mb-3 px-2">{list.name}</h2>

      <div className="flex-grow overflow-y-auto pr-1">
        {sortedTasks.length > 0 ? (
          <ul className="space-y-2">
            <AnimatePresence>
              {sortedTasks.map((task) => (
                <motion.li
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-between items-center p-2 hover:bg-light-background dark:hover:bg-background rounded-lg group"
                >
                  <label className="flex items-center gap-3 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => onToggleTask(task.id)}
                      className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-primary focus:ring-primary flex-shrink-0"
                    />
                    <div className="flex-grow">
                      <span className={`transition ${task.completed ? 'line-through text-light-text-secondary dark:text-text-secondary' : ''}`}>{task.content}</span>
                      {task.dueDate && (
                        <p className={`text-xs flex items-center gap-1 mt-0.5 ${task.completed ? 'text-light-text-secondary dark:text-text-secondary' : 'text-primary'}`}>
                          <HiOutlineCalendarDays />
                          {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </label>
                  <button onClick={() => onDeleteTask(task.id)} className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <HiOutlineTrash className="h-5 w-5" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <p className="text-light-text-secondary dark:text-text-secondary text-center py-4 px-2">{t('tasks.noTasksInList')}</p>
        )}
      </div>

      <div className="mt-4 pt-2 border-t border-slate-200 dark:border-zinc-700/50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder={t('tasks.addTaskPlaceholder')}
            className="w-full bg-transparent p-2 focus:outline-none"
          />
           <button onClick={handleAddTask} className="p-2 text-primary rounded-full hover:bg-primary/10 transition-colors disabled:text-slate-400 disabled:hover:bg-transparent" disabled={!newItem.trim()}>
              <HiPlus className="h-5 w-5" />
           </button>
        </div>
        {showDueDate && (
           <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} className="mt-2">
            <input
                ref={dueDateInputRef}
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg bg-light-background dark:bg-background border-slate-300 dark:border-slate-600"
              />
           </motion.div>
        )}
      </div>
       <div className="mt-2 flex items-center justify-end">
            <button onClick={() => {setShowDueDate(!showDueDate); setTimeout(() => dueDateInputRef.current?.focus(), 0)}} className="p-2 text-light-text-secondary dark:text-text-secondary rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
                <HiOutlineCalendarDays className="h-5 w-5"/>
            </button>
            <button onClick={() => onDeleteList(list)} className="p-2 text-light-text-secondary dark:text-text-secondary rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
                <HiOutlineTrash className="h-5 w-5" />
            </button>
       </div>
    </div>
  );
};

const TasksPage: React.FC = () => {
  const { loading, tasks, taskLists, addTaskList, addTask, toggleTask, deleteTask, deleteTaskList } = useAppContext();
  const { t } = useTranslation();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<ITaskList | null>(null);
  const [newListName, setNewListName] = useState('');

  const handleCreateList = () => {
    if (newListName.trim()) {
      addTaskList(newListName.trim());
      toast.success(t('tasks.listCreated', { listName: newListName.trim() }));
      setCreateModalOpen(false);
      setNewListName('');
    } else {
      toast.error(t('tasks.modal.nameRequired'));
    }
  };
  
  const confirmDeleteList = () => {
    if (listToDelete) {
        deleteTaskList(listToDelete.id);
        toast.success(t('tasks.listDeleted'));
        setDeleteModalOpen(false);
        setListToDelete(null);
    }
  };

  const openDeleteModal = (list: ITaskList) => {
    setListToDelete(list);
    setDeleteModalOpen(true);
  };

  const renderSkeleton = () => (
     <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-light-surface dark:bg-surface rounded-2xl shadow-lg p-4 border border-slate-200 dark:border-zinc-700/50 break-inside-avoid mb-6">
                <Skeleton className="h-8 w-1/2 mb-4" />
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        ))}
    </div>
  );

  const fabActions: SpeedDialAction[] = [
    {
      id: 'new_list',
      label: t('tasks.createList') || 'New List',
      icon: HiOutlineQueueList,
      color: 'rose',
      onClick: () => setCreateModalOpen(true),
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-10rem)]">
      <PageHeader
        title={t('tasks.title')}
        action={
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-primary text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity text-xs sm:text-sm whitespace-nowrap"
          >
            <HiPlus className="h-4 w-4" />
            <span>{t('tasks.createList')}</span>
          </button>
        }
      />
      
      {loading ? (
        renderSkeleton()
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
            <AnimatePresence>
                {taskLists.map((list) => {
                    const listTasks = tasks.filter(task => task.listId === list.id);
                    return (
                        <motion.div key={list.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                            <TaskListCard
                                list={list}
                                tasks={listTasks}
                                onAddTask={(listId, content, dueDate) => addTask({ content, listId, dueDate })}
                                onToggleTask={toggleTask}
                                onDeleteTask={deleteTask}
                                onDeleteList={openDeleteModal}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
      )}
      
      {/* SPEED DIAL FLOATING ACTION BUTTON */}
      <SpeedDialFAB
        actions={fabActions}
        onSingleAction={() => setCreateModalOpen(true)}
        mainLabel={t('tasks.createList') || 'New List'}
      />
      
      {/* Create List Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title={t('tasks.modal.title')}>
        <div className="space-y-4">
            <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder={t('tasks.modal.placeholder')}
                className="w-full mt-1 p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm"
                autoFocus
            />
            <button
                onClick={handleCreateList}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-opacity-90 transition-colors text-sm"
            >
                {t('tasks.modal.createBtn')}
            </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
       <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title={t('tasks.deleteModal.title')}>
        <div className="space-y-6">
          <p className="text-light-text-secondary dark:text-text-secondary">
              {t('tasks.deleteModal.message', { listName: listToDelete?.name || '' })}
          </p>
          <div className="flex justify-end gap-4">
              <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-zinc-700 text-light-text-primary dark:text-text-primary font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-zinc-600 text-sm"
              >
                  {t('tasks.deleteModal.cancel')}
              </button>
              <button
                  onClick={confirmDeleteList}
                  className="px-4 py-2 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 text-sm"
              >
                  {t('tasks.deleteModal.confirm')}
              </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TasksPage;
