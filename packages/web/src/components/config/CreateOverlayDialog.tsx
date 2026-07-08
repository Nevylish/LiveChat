import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateOverlayDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: string;
    onChange: (val: string) => void;
    onCreate: () => void;
    isGenerating: boolean;
    error: string | null;
    title?: string;
    description?: string;
}

export default function CreateOverlayDialog({
    open,
    onOpenChange,
    value,
    onChange,
    onCreate,
    isGenerating,
    error,
    title = 'Créer un overlay',
    description = 'Choisissez un pseudo pour identifier cet overlay. Vous pourrez le modifier plus tard.',
}: CreateOverlayDialogProps) {
    const isValid = value.length >= 4 && value.length <= 25;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (isValid && !isGenerating) onCreate();
                    }}
                    className="space-y-4"
                >
                    <div className="space-y-1.5">
                        <Label htmlFor="create-overlay-name" className="text-xs text-muted-foreground">
                            Pseudo d'affichage
                        </Label>
                        <Input
                            id="create-overlay-name"
                            autoFocus
                            placeholder="noobmaster69"
                            value={value}
                            onChange={(e) => {
                                let clean = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                                if (clean.startsWith('_')) clean = clean.substring(1);
                                onChange(clean);
                            }}
                        />
                        <p className="text-xs text-muted-foreground">Entre 4 et 25 caractères.</p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2.5 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>{error}</div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Annuler
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={!isValid || isGenerating}>
                            {isGenerating ? 'Création...' : "Créer l'overlay"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
