import { IconFolderPlus, IconMistOff, IconPlus, IconSearch, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  CloseSidebarButton,
  OpenSidebarButton,
} from './components/OpenCloseButton';

import Search from '../Search';

interface Props<T> {
  isOpen: boolean;
  addItemButtonTitle: string;
  side: 'left' | 'right';
  items: T[];
  itemComponent: ReactNode;
  folderComponent: ReactNode;
  footerComponent?: ReactNode;
  searchTerm: string;
  handleSearchTerm: (searchTerm: string) => void;
  toggleOpen: () => void;
  handleCreateItem: () => void;
  handleCreateFolder: () => void;
  handleDrop: (e: any) => void;
}

const Sidebar = <T,>({
  isOpen,
  addItemButtonTitle,
  side,
  items,
  itemComponent,
  folderComponent,
  footerComponent,
  searchTerm,
  handleSearchTerm,
  toggleOpen,
  handleCreateItem,
  handleCreateFolder,
  handleDrop,
}: Props<T>) => {
  const { t } = useTranslation('promptbar');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const allowDrop = (e: any) => {
    e.preventDefault();
  };

  const highlightDrop = (e: any) => {
    e.target.style.background = '#343541';
  };

  const removeHighlight = (e: any) => {
    e.target.style.background = 'none';
  };

  return isOpen ? (
    <div>
      <div
        className={`fixed top-0 ${side}-0 z-40 flex h-full w-[280px] flex-none flex-col space-y-4 bg-[#1a1b1e] p-4 text-[14px] transition-all duration-300 ease-in-out shadow-xl sm:relative sm:top-0`}
      >
        {/* Header Section */}
        <div className="flex items-center gap-2">
          <button
            className="flex-1 flex items-center gap-3 rounded-lg p-3 text-sm transition-all duration-200 hover:bg-blue-600/20 text-white border border-white/10 hover:scale-105 active:scale-95"
            onClick={() => {
              handleCreateItem();
              handleSearchTerm('');
            }}
          >
            <IconPlus size={18} className="text-blue-400" />
            {addItemButtonTitle}
          </button>

          <button
            className="flex items-center justify-center p-3 rounded-lg transition-all duration-200 hover:bg-blue-600/20 text-white border border-white/10 hover:scale-105 active:scale-95"
            onClick={handleCreateFolder}
            title="Create Folder"
          >
            <IconFolderPlus size={18} className="text-blue-400" />
          </button>
        </div>

        {/* Search Section */}
        <div className={`relative transition-all duration-200 ${isSearchFocused ? 'scale-105' : ''}`}>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <IconSearch size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
          placeholder={t('Search...') || ''}
            value={searchTerm}
            onChange={(e) => handleSearchTerm(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
          />
        </div>

        {/* Content Section */}
        <div className="flex-grow overflow-auto space-y-4">
          {items?.length > 0 && (
            <div className="flex border-b border-white/10 pb-4">
              {folderComponent}
            </div>
          )}

          {items?.length > 0 ? (
            <div
              className="pt-2 space-y-2"
              onDrop={handleDrop}
              onDragOver={allowDrop}
              onDragEnter={highlightDrop}
              onDragLeave={removeHighlight}
            >
              {itemComponent}
            </div>
          ) : (
            <div className="mt-8 select-none text-center text-white opacity-50 animate-fade-in">
              <IconMistOff className="mx-auto mb-3 text-gray-400" size={32} />
              <span className="text-[14px] leading-normal">
                {t('No data.')}
              </span>
            </div>
          )}
        </div>

        {/* Footer Section */}
        {footerComponent && (
          <div className="border-t border-white/10 pt-4">
        {footerComponent}
          </div>
        )}
      </div>

      <CloseSidebarButton onClick={toggleOpen} side={side} />
    </div>
  ) : (
    <OpenSidebarButton onClick={toggleOpen} side={side} />
  );
};

export default Sidebar;
