import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faClock,
  faDollarSign,
  faPercent,
  faStopwatch,
  faUtensils,
} from '@fortawesome/free-solid-svg-icons';
import { fadeIn } from '../../../../design-tokens/motion';
import { Input } from '../../../../shared/ui/Input';
import { Textarea } from '../../../../shared/ui/Textarea';
import { PlanetAlert } from '../../../../shared/alert/organisms/PlanetAlert';
import { RecursosDropdown } from '../../../recursos/ui/molecules/recursos-dropdown';
import { Switch } from '../atoms/Switch';
import { PlatoAlimentosAnimado } from '../atoms/PlatoAlimentosAnimado';
import { SeccionCargaImagen } from '../molecules/SeccionCargaImagen';
import { Rocket } from '../../../../shared/rocket/organisms/Rocket';
import { useFormularioAgregarProducto } from '../../application/use-formulario-agregar-producto';
import type { MenuCategoria } from '../../domain/menu-categoria';

export interface FormularioAgregarProductoCardProps {
  categoriaInicial?: MenuCategoria | null;
  categoriasDisponibles?: MenuCategoria[];
  onProductoGuardado?: () => void;
  onCancelar?: () => void;
}

export function FormularioAgregarProductoCard({
  categoriaInicial,
  categoriasDisponibles = [],
  onProductoGuardado,
  onCancelar,
}: FormularioAgregarProductoCardProps) {
  const {
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    categoriaOptions,
    loadingCategorias,
    categoriaError,
    setCategoriaError,
    name,
    setName,
    nameError,
    setNameError,
    price,
    setPrice,
    priceError,
    setPriceError,
    taxPercentage,
    setTaxPercentage,
    prepTime,
    setPrepTime,
    isVegetarian,
    setIsVegetarian,
    isVegan,
    setIsVegan,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    available,
    setAvailable,
    description,
    setDescription,
    imagenArchivo,
    imagenPreview,
    handleImageChange,
    resetKey,
    saving,
    productosRegistrados,
    feedback,
    setFeedback,
    handleSubmit,
  } = useFormularioAgregarProducto({
    categoriaInicial,
    categoriasDisponibles,
    onProductoGuardado,
  });

  return (
    <>
      {/* Animación del cohete Rocket mientras se envía el producto a POST /item-menu */}
      <AnimatePresence>
        {saving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 p-4 backdrop-blur-md select-none text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="flex flex-col items-center"
            >
              <div className="relative rounded-3xl border border-white/20 bg-panel/90 p-3 shadow-2xl backdrop-blur-xl">
                <Rocket
                  launch={true}
                  autoLaunch={true}
                  interactive={false}
                  size="md"
                  showStars={true}
                  showPad={true}
                />
              </div>

              <div className="mt-5 space-y-1.5 max-w-sm">
                <h3 className="font-serif text-lg font-bold text-white tracking-wide">
                  Registrando Producto
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Guardando el producto en el catálogo, por favor espera un momento…
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="border-line bg-panel w-full rounded-3xl border p-6 shadow-xs sm:p-8"
      >
        {/* Cabecera */}
        <div className="border-line flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <PlatoAlimentosAnimado />
            <h2 className="text-ink font-serif text-2xl font-bold">
              Agregar Producto o Platillo
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {productosRegistrados > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span>
                  {productosRegistrados}{' '}
                  {productosRegistrados === 1
                    ? 'producto guardado'
                    : 'productos guardados'}
                </span>
              </div>
            )}
            {categoriaInicial && (
              <div className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-semibold">
                <span>Categoría:</span>
                <strong className="text-ink">{categoriaInicial.name}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Formulario principal */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
          {(categoriaOptions.length > 0 || loadingCategorias) && (
            <RecursosDropdown
              label="Categoría del menú asignada"
              placeholder={
                loadingCategorias
                  ? 'Cargando categorías…'
                  : 'Selecciona una categoría…'
              }
              value={categoriaSeleccionada}
              onChange={(val) => {
                setCategoriaSeleccionada(val);
                if (categoriaError) setCategoriaError(undefined);
              }}
              options={categoriaOptions}
              error={categoriaError}
              required
              isLoading={loadingCategorias}
              disabled={loadingCategorias}
              emptyLabel="No hay categorías disponibles."
            />
          )}

          {/* Fila 1: Nombre y Precio */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre del producto o platillo"
              placeholder="Ej. Bowl de Quinoa y Aguacate"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(undefined);
              }}
              error={nameError}
              required
              icon={<FontAwesomeIcon icon={faUtensils} className="size-4" />}
            />

            <Input
              label="Precio de venta (COP)"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej. 14.50"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (priceError) setPriceError(undefined);
              }}
              error={priceError}
              required
              icon={<FontAwesomeIcon icon={faDollarSign} className="size-4" />}
            />
          </div>

          {/* Fila 2: Porcentaje de Impuesto y Tiempo de Preparación */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Porcentaje de impuesto (%)"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej. 10.0"
              value={taxPercentage}
              onChange={(e) => setTaxPercentage(e.target.value)}
              icon={<FontAwesomeIcon icon={faPercent} className="size-4" />}
            />

            <Input
              label="Tiempo de preparación (minutos)"
              type="number"
              min="1"
              placeholder="Ej. 15"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              icon={<FontAwesomeIcon icon={faStopwatch} className="size-4" />}
            />
          </div>

          {/* Fila 3: Horarios de Servicio ("Solo hora") */}
          <div className="border-line bg-canvas/40 rounded-2xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-primary text-xs font-bold tracking-wider uppercase">
                  Ventana de Horario
                </span>
                <p className="text-ink-muted text-xs">
                  Horas del día en que cocina y bar despachan este producto.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Fecha de inicio (Solo hora)"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                icon={<FontAwesomeIcon icon={faClock} className="size-4" />}
              />

              <Input
                label="Fecha final (Solo hora)"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                icon={<FontAwesomeIcon icon={faClock} className="size-4" />}
              />
            </div>
          </div>

          {/* Fila 4: Switches */}
          <div className="space-y-3">
            <span className="text-ink block text-sm font-semibold">
              Preferencias dietéticas y estado en catálogo
            </span>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Switch
                label="¿Es vegetariano?"
                description="Apto para dietas sin carnes"
                checked={isVegetarian}
                onChange={setIsVegetarian}
              />

              <Switch
                label="¿Es vegano?"
                description="Libre de derivados animales"
                checked={isVegan}
                onChange={setIsVegan}
              />

              <Switch
                label="Disponible"
                description="Habilitado para pedidos hoy"
                checked={available}
                onChange={setAvailable}
              />
            </div>
          </div>

          {/* Fila 5: Descripción comercial y notas de sabor con Textarea reutilizable */}
          <Textarea
            label="Descripción comercial y notas de sabor"
            rows={3}
            maxLength={280}
            showCount
            resize="none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe los ingredientes principales, alérgenos o maridajes recomendados..."
          />

          {/* Fila 6: Sección para seleccionar imagen */}
          <SeccionCargaImagen
            key={resetKey}
            imageFile={imagenArchivo}
            imagePreview={imagenPreview}
            onImageChange={handleImageChange}
          />

          {/* Alerta reutilizable PlanetAlert según respuesta del endpoint POST /item-menu */}
          {feedback && (
            <PlanetAlert
              key={feedback.id}
              variant={feedback.variant}
              planet={feedback.planet}
              title={feedback.title}
              message={feedback.message}
              error={feedback.rawError}
              dismissible
              onClose={() => setFeedback(null)}
              role={feedback.isValid ? 'status' : 'alert'}
              actions={
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold opacity-80">
                    HTTP {feedback.status}
                  </span>

                  {feedback.isValid && onCancelar && (
                    <button
                      type="button"
                      onClick={onCancelar}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-400/50 bg-white/85 px-3 py-1.5 text-xs font-bold text-emerald-900 transition-colors hover:bg-white dark:border-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-100"
                    >
                      <span>Terminar y ver catálogo</span>
                      <FontAwesomeIcon icon={faArrowRight} className="size-3" />
                    </button>
                  )}
                </div>
              }
            >
              {feedback.isValid && (
                <p className="text-xs opacity-85">
                  El formulario está limpio y listo para continuar registrando el
                  siguiente producto.
                </p>
              )}
            </PlanetAlert>
          )}

          {/* Botones de acción */}
          <div className="border-line flex flex-col-reverse items-center justify-end gap-3 border-t pt-4 sm:flex-row">
            {onCancelar && (
              <button
                type="button"
                onClick={onCancelar}
                disabled={saving}
                className="border-line bg-canvas text-ink-muted hover:bg-panel hover:text-ink w-full cursor-pointer rounded-2xl border px-6 py-3 text-xs font-bold transition-colors sm:w-auto"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-primary shadow-primary/20 hover:bg-primary/90 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-8 py-3 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 sm:w-auto"
            >
              <span>
                {saving
                  ? 'Guardando y registrando...'
                  : 'Guardar y Registrar producto'}
              </span>
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
