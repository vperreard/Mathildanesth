import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

<Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
    <DialogContent
        className="max-w-none w-[90vw] h-[95vh] 
               sm:w-[90vw] sm:max-w-[90vw] 
               md:w-[90vw] md:max-w-[90vw] 
               lg:w-[95vw] lg:max-w-[95vw] 
               xl:w-[95vw] xl:max-w-[1800px] 
               flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
      // ... existing code ...
        </DialogHeader>
    </DialogContent>
</Dialog> 