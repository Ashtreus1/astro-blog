'use client';

import { ScrollArea } from '@/components/ui/scroll-area';

export default function ScrollWrapper({ children }: { children: React.ReactNode; }) {
  return (
    <ScrollArea className="h-[400px]">
        {children}
    </ScrollArea>
  );
}
