/**
 * ServiceSelector Component
 * Interactive service selection for the Priority_Selection question
 * Allows users to select, add, and remove services for their campaign focus
 */

'use client';

import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceSelectorProps {
  services: string[];
  selectedServices: string[];
  onSelectionChange: (selected: string[]) => void;
  onServicesChange?: (services: string[]) => void;
}

export function ServiceSelector({
  services,
  selectedServices,
  onSelectionChange,
  onServicesChange,
}: ServiceSelectorProps) {
  const [allServices, setAllServices] = useState<string[]>(services);
  const [newService, setNewService] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleService = (service: string) => {
    if (selectedServices.includes(service)) {
      onSelectionChange(selectedServices.filter((s) => s !== service));
    } else {
      onSelectionChange([...selectedServices, service]);
    }
  };

  const handleAddService = () => {
    const trimmed = newService.trim();
    if (trimmed && !allServices.includes(trimmed)) {
      const updatedServices = [...allServices, trimmed];
      setAllServices(updatedServices);
      onSelectionChange([...selectedServices, trimmed]);
      onServicesChange?.(updatedServices);
    }
    setNewService('');
    setIsAddingService(false);
  };

  const handleRemoveService = (service: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedServices = allServices.filter((s) => s !== service);
    setAllServices(updatedServices);
    onSelectionChange(selectedServices.filter((s) => s !== service));
    onServicesChange?.(updatedServices);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddService();
    } else if (e.key === 'Escape') {
      setIsAddingService(false);
      setNewService('');
    }
  };

  const selectAll = () => {
    onSelectionChange([...allServices]);
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Service Chips */}
      <div className="flex flex-wrap gap-2">
        {allServices.map((service) => {
          const isSelected = selectedServices.includes(service);
          return (
            <Badge
              key={service}
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-all duration-200 group py-1.5 px-3 text-sm',
                isSelected
                  ? 'bg-primary hover:bg-primary/90'
                  : 'hover:border-primary/50 hover:bg-primary/5'
              )}
              onClick={() => toggleService(service)}
            >
              {isSelected && <Check className="w-3 h-3 ml-1.5 flex-shrink-0" />}
              <span>{service}</span>
              <button
                onClick={(e) => handleRemoveService(service, e)}
                className={cn(
                  'mr-1.5 p-0.5 rounded-full transition-colors flex-shrink-0',
                  isSelected
                    ? 'hover:bg-primary-foreground/20'
                    : 'hover:bg-destructive/20'
                )}
                aria-label={`הסר ${service}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          );
        })}

        {/* Add Service Button/Input */}
        {isAddingService ? (
          <div className="flex items-center gap-1">
            <Input
              ref={inputRef}
              type="text"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newService.trim()) {
                  setIsAddingService(false);
                }
              }}
              placeholder="הקלד שירות חדש..."
              className="h-8 w-40 text-sm"
              dir="rtl"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={handleAddService}
              disabled={!newService.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Badge
            variant="outline"
            className="cursor-pointer transition-all duration-200 py-1.5 px-3 text-sm border-dashed hover:border-primary hover:bg-primary/5"
            onClick={() => {
              setIsAddingService(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
          >
            <Plus className="w-3 h-3 ml-1" />
            הוסף שירות
          </Badge>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3 text-xs">
        <button
          onClick={selectAll}
          className="text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline"
        >
          בחר הכל
        </button>
        <span className="text-muted-foreground/50">|</span>
        <button
          onClick={deselectAll}
          className="text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline"
        >
          נקה בחירה
        </button>
        <span className="text-muted-foreground/50">|</span>
        <span className="text-muted-foreground">
          {selectedServices.length} מתוך {allServices.length} נבחרו
        </span>
      </div>
    </div>
  );
}
