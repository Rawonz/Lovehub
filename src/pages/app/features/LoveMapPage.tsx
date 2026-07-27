import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { MapPin, Plus, Pencil, Trash2, Navigation, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useT, type TranslationKey } from '@/lib/i18n';
import { loveMapLocationSchema } from '@/lib/schemas';
import {
  useLoveMapLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
  LOCATION_CATEGORIES,
} from '@/features/love-map/useLoveMap';
import type { LoveMapLocation, LocationCategory } from '@/types/database';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineLoader, ButtonLoader } from '@/components/ui/loader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface FormValues {
  name: string;
  description?: string;
  lat: number;
  lng: number;
  address?: string;
  category: LocationCategory;
}

const categoryColors: Record<LocationCategory, string> = {
  special: 'bg-primary',
  first_date: 'bg-info',
  trip: 'bg-success',
  restaurant: 'bg-warning',
  home: 'bg-chart-4',
  other: 'bg-muted-foreground',
};

export function LoveMapPage() {
  const t = useT();
  const { data: locations, isLoading } = useLoveMapLocations();
  const createMut = useCreateLocation();
  const updateMut = useUpdateLocation();
  const deleteMut = useDeleteLocation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LoveMapLocation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LoveMapLocation | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(loveMapLocationSchema),
    defaultValues: { name: '', description: '', lat: 0, lng: 0, address: '', category: 'special' },
  });

  const lat = watch('lat');
  const lng = watch('lng');
  const category = watch('category');

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', description: '', lat: 0, lng: 0, address: '', category: 'special' });
    setDialogOpen(true);
  };

  const openEdit = (loc: LoveMapLocation) => {
    setEditing(loc);
    reset({
      name: loc.name,
      description: loc.description ?? '',
      lat: loc.lat,
      lng: loc.lng,
      address: loc.address ?? '',
      category: loc.category,
    });
    setDialogOpen(true);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t('errors.generic'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('lat', Number(pos.coords.latitude.toFixed(6)));
        setValue('lng', Number(pos.coords.longitude.toFixed(6)));
      },
      () => toast.error(t('errors.generic'))
    );
  };

  const onSubmit = async (values: FormValues) => {
    if (values.lat === 0 && values.lng === 0) {
      toast.error(t('loveMap.pickOnMap'));
      return;
    }
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...values });
        toast.success(t('toast.updated'));
      } else {
        await createMut.mutateAsync({ ...values, description: values.description ?? null, address: values.address ?? null });
        toast.success(t('toast.created'));
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(t('errors.generic'));
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success(t('toast.deleted'));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(t('errors.generic'));
      console.error(err);
    }
  };

  const hasCoords = lat !== 0 || lng !== 0;

  // Build a map showing all saved locations, or just the form coords when editing.
  const allCoords = (locations ?? []).filter((l) => l.lat !== 0 || l.lng !== 0);
  const formCoord = hasCoords ? [{ lat, lng }] : [];
  const mapPoints = formCoord.length > 0 ? formCoord : allCoords;

  let mapSrc: string;
  if (mapPoints.length === 0) {
    mapSrc = 'https://www.openstreetmap.org/export/embed.html?bbox=-0.01%2C-0.01%2C0.01%2C0.01&layer=mapnik';
  } else if (mapPoints.length === 1) {
    const p = mapPoints[0];
    mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${p.lng - 0.01}%2C${p.lat - 0.01}%2C${p.lng + 0.01}%2C${p.lat + 0.01}&layer=mapnik&marker=${p.lat}%2C${p.lng}`;
  } else {
    const lats = mapPoints.map((p) => p.lat);
    const lngs = mapPoints.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const padLat = Math.max((maxLat - minLat) * 0.2, 0.01);
    const padLng = Math.max((maxLng - minLng) * 0.2, 0.01);
    const markers = mapPoints.map((p) => `${p.lat}%2C${p.lng}`).join('%2C');
    mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng - padLng}%2C${minLat - padLat}%2C${maxLng + padLng}%2C${maxLat + padLat}&layer=mapnik&marker=${markers}`;
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{t('loveMap.title')} — LoveHub</title>
      </Helmet>

      <PageHeader
        title={t('loveMap.title')}
        subtitle={t('loveMap.subtitle')}
        icon={MapPin}
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('loveMap.add')}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map preview */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="relative h-[420px] w-full overflow-hidden rounded-xl bg-muted">
              <iframe
                title="Love Map"
                src={mapSrc}
                className="h-full w-full border-0"
                loading="lazy"
              />
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <InlineLoader label={t('common.loading')} />
            ) : !locations || locations.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title={t('loveMap.empty')}
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <ul className="space-y-2">
                {locations.map((loc) => (
                  <motion.li
                    key={loc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                  >
                    <span className={`mt-1 flex h-3 w-3 shrink-0 rounded-full ${categoryColors[loc.category]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{loc.name}</p>
                      {loc.address && (
                        <p className="truncate text-xs text-muted-foreground">{loc.address}</p>
                      )}
                      <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        {t(`loveMap.categories.${loc.category}` as TranslationKey)}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(loc)} aria-label={t('common.edit')}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(loc)}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              {editing ? t('loveMap.edit') : t('loveMap.new')}
            </DialogTitle>
            <DialogDescription>{t('loveMap.subtitle')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t('loveMap.name')}</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{t('common.required')}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lat">{t('loveMap.latitude')}</Label>
                <Input id="lat" type="number" step="any" {...register('lat', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lng">{t('loveMap.longitude')}</Label>
                <Input id="lng" type="number" step="any" {...register('lng', { valueAsNumber: true })} />
              </div>
            </div>

            <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
              <Navigation className="mr-2 h-4 w-4" />
              {t('loveMap.geolocate')}
            </Button>

            {hasCoords && (
              <div className="overflow-hidden rounded-lg border border-border">
                <iframe
                  title="Pick location"
                  src={mapSrc}
                  className="h-48 w-full border-0"
                  loading="lazy"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="address">{t('loveMap.address')}</Label>
              <Input id="address" {...register('address')} />
            </div>

            <div className="space-y-1.5">
              <Label>{t('common.category')}</Label>
              <Select value={category} onValueChange={(v) => setValue('category', v as LocationCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`loveMap.categories.${c}` as TranslationKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea id="description" rows={2} {...register('description')} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <ButtonLoader className="mr-2" />}
                {editing ? t('common.update') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('loveMap.deleteConfirm')}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
