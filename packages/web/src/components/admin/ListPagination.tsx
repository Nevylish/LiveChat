import type { DevPaginationMeta } from '@livechat/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ListPaginationProps {
    pagination: DevPaginationMeta | null;
    onPageChange: (page: number) => void;
    disabled?: boolean;
}

export default function ListPagination({ pagination, onPageChange, disabled }: ListPaginationProps) {
    if (!pagination || pagination.total === 0) {
        return null;
    }

    const from = (pagination.page - 1) * pagination.pageSize + 1;
    const to = Math.min(pagination.page * pagination.pageSize, pagination.total);

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                {from}–{to} sur {pagination.total} · page {pagination.page} / {pagination.totalPages}
            </p>
            <div className="flex w-full gap-2 sm:w-auto">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    disabled={disabled || pagination.page <= 1}
                    onClick={() => onPageChange(pagination.page - 1)}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    disabled={disabled || pagination.page >= pagination.totalPages}
                    onClick={() => onPageChange(pagination.page + 1)}
                >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
