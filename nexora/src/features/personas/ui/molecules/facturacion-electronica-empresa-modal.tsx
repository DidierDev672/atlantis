import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBuilding,
  faCheck,
  faEnvelope,
  faFileInvoiceDollar,
  faIdCard,
  faLocationDot,
  faPhone,
  faTrash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

import type { DatosEmpresaFacturacion } from '../../domain/facturacion-empresa-storage'

export type { DatosEmpresaFacturacion } from '../../domain/facturacion-empresa-storage'

export interface FacturacionElectronicaEmpresaModalProps {
  isOpen: boolean
  personKey: string
  guestName: string
  guestDocument: string
  roomLabel: string
  initialData?: DatosEmpresaFacturacion | null
  onClose: () => void
  onSave: (personKey: string, data: DatosEmpresaFacturacion) => void
  onRemove?: (personKey: string) => void
}

export function FacturacionElectronicaEmpresaModal({
  isOpen,
  personKey,
  guestName,
  guestDocument,
  roomLabel,
  initialData,
  onClose,
  onSave,
  onRemove,
}: FacturacionElectronicaEmpresaModalProps) {
  const [razonSocial, setRazonSocial] = useState(initialData?.razonSocial ?? '')
  const [nit, setNit] = useState(initialData?.nit ?? '')
  const [digitoVerificacion, setDigitoVerificacion] = useState(
    initialData?.digitoVerificacion ?? '',
  )
  const [tipoContribuyente, setTipoContribuyente] = useState<
    DatosEmpresaFacturacion['tipoContribuyente']
  >(initialData?.tipoContribuyente ?? 'juridica')
  const [regimenFiscal, setRegimenFiscal] = useState(
    initialData?.regimenFiscal ?? 'Responsable de IVA (Régimen Común)',
  )
  const [correoFacturacion, setCorreoFacturacion] = useState(
    initialData?.correoFacturacion ?? '',
  )
  const [telefonoEmpresa, setTelefonoEmpresa] = useState(
    initialData?.telefonoEmpresa ?? '',
  )
  const [direccionFiscal, setDireccionFiscal] = useState(
    initialData?.direccionFiscal ?? '',
  )
  const [ciudad, setCiudad] = useState(initialData?.ciudad ?? '')
  const [observaciones, setObservaciones] = useState(
    initialData?.observaciones ?? '',
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!razonSocial.trim()) {
      setErrorMsg('Ingresa la Razón Social o nombre de la empresa.')
      return
    }
    if (!nit.trim()) {
      setErrorMsg('Ingresa el NIT o identificación tributaria de la empresa.')
      return
    }
    if (!correoFacturacion.trim() || !correoFacturacion.includes('@')) {
      setErrorMsg('Ingresa un correo electrónico válido para el envío de la factura electrónica.')
      return
    }

    setErrorMsg(null)
    onSave(personKey, {
      personId: personKey,
      guestName,
      razonSocial: razonSocial.trim(),
      nit: nit.trim(),
      digitoVerificacion: digitoVerificacion.trim(),
      tipoContribuyente,
      regimenFiscal: regimenFiscal.trim(),
      correoFacturacion: correoFacturacion.trim(),
      telefonoEmpresa: telefonoEmpresa.trim(),
      direccionFiscal: direccionFiscal.trim(),
      ciudad: ciudad.trim(),
      observaciones: observaciones.trim(),
      updatedAt: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/55 backdrop-blur-xs"
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Datos de empresa para Facturación Electrónica"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="border-line bg-panel relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
          >
            {/* Cabecera */}
            <div className="border-line bg-canvas/60 flex items-start justify-between gap-4 border-b px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-xl">
                  <FontAwesomeIcon icon={faFileInvoiceDollar} className="size-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-ink text-base font-bold">
                      Datos para Facturación Electrónica
                    </h2>
                    <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                      Empresa / Tercero
                    </span>
                  </div>
                  <p className="text-ink-muted mt-0.5 text-xs">
                    Huésped: <strong className="text-ink">{guestName}</strong> ({guestDocument}) ·{' '}
                    <span className="text-primary font-semibold">{roomLabel}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar modal"
                className="border-line bg-panel text-ink-muted hover:text-ink grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="size-4" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto px-6 py-5 text-xs">
              {errorMsg && (
                <div className="border-danger/30 bg-danger/10 text-danger rounded-xl border px-3.5 py-2.5 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                {/* Razón social */}
                <div className="sm:col-span-12">
                  <label className="text-ink mb-1.5 block font-semibold">
                    Razón Social o Nombre de la Empresa <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faBuilding}
                      className="text-ink-muted absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2"
                    />
                    <input
                      type="text"
                      value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value)}
                      placeholder="Ej. Inversiones y Soluciones Corporativas S.A.S."
                      className="border-line bg-canvas text-ink focus:border-primary focus:ring-primary/20 h-10 w-full rounded-xl border pr-3.5 pl-9 text-xs outline-none focus:ring-2"
                    />
                  </div>
                </div>

                {/* NIT / RUT */}
                <div className="sm:col-span-5">
                  <label className="text-ink mb-1.5 block font-semibold">
                    NIT / Identificación Tributaria <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faIdCard}
                      className="text-ink-muted absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2"
                    />
                    <input
                      type="text"
                      value={nit}
                      onChange={(e) => setNit(e.target.value)}
                      placeholder="Ej. 901456789"
                      className="border-line bg-canvas text-ink focus:border-primary focus:ring-primary/20 h-10 w-full rounded-xl border pr-3.5 pl-9 text-xs outline-none focus:ring-2"
                    />
                  </div>
                </div>

                {/* DV */}
                <div className="sm:col-span-2">
                  <label className="text-ink mb-1.5 block font-semibold">DV</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={digitoVerificacion}
                    onChange={(e) => setDigitoVerificacion(e.target.value)}
                    placeholder="Ej. 4"
                    className="border-line bg-canvas text-ink focus:border-primary focus:ring-primary/20 h-10 w-full rounded-xl border px-3 text-center text-xs outline-none focus:ring-2"
                  />
                </div>

                {/* Tipo de contribuyente */}
                <div className="sm:col-span-5">
                  <label className="text-ink mb-1.5 block font-semibold">
                    Tipo de Contribuyente
                  </label>
                  <select
                    value={tipoContribuyente}
                    onChange={(e) =>
                      setTipoContribuyente(
                        e.target.value as DatosEmpresaFacturacion['tipoContribuyente'],
                      )
                    }
                    className="border-line bg-canvas text-ink focus:border-primary focus:ring-primary/20 h-10 w-full cursor-pointer rounded-xl border px-3 text-xs outline-none focus:ring-2"
                  >
                    <option value="juridica">Persona Jurídica (Empresa)</option>
                    <option value="gran_contribuyente">Gran Contribuyente</option>
                    <option value="natural_responsable">Persona Natural Responsable</option>
                  </select>
                </div>

                {/* Correo de facturación */}
                <div className="sm:col-span-7">
                  <label className="text-ink mb-1.5 block font-semibold">
                    Correo para recepción de Factura Electrónica (XML / PDF){' '}
                    <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="text-ink-muted absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2"
                    />
                    <input
                      type="email"
                      value={correoFacturacion}
                      onChange={(e) => setCorreoFacturacion(e.target.value)}
                      placeholder="facturacion@empresa.com"
                      className="border-line bg-canvas text-ink focus:border-primary focus:ring-primary/20 h-10 w-full rounded-xl border pr-3.5 pl-9 text-xs outline-none focus:ring-2"
                    />
                  </div>
                </div>

                {/* Teléfono empresa */}
                <div className="sm:col-span-5">
                  <label className="text-ink mb-1.5 block font-semibold">
                    Teléfono Corporativo
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faPhone}
                      className="text-ink-muted absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2"
                    />
                    <input
                      type="tel"
                      value={telefonoEmpresa}
                      onChange={(e) => setTelefonoEmpresa(e.target.value)}
                      placeholder="Ej. +57 601 745 8900"
                      className="border-line bg-canvas text-ink focus:border-primary focus:ring-primary/20 h-10 w-full rounded-xl border pr-3.5 pl-9 text-xs outline-none focus:ring-2"
                    />
                  </div>
                </div>

                {/* Dirección Fiscal */}
                <div className="sm:col-span-7">
                  <label className="text-ink mb-1.5 block font-semibold">
                    Dirección Fiscal
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faLocationDot}
                      className="text-ink-muted absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2"
                    />
                    <input
                      type="text"
                      value={direccionFiscal}
                      onChange={(e) => setDireccionFiscal(e.target.value)}
                      placeholder="Ej. Calle 100 # 19-61 Of. 402"
                      className="border-line bg-canvas text-ink focus:border-primary focus:ring-primary/20 h-10 w-full rounded-xl border pr-3.5 pl-9 text-xs outline-none focus:ring-2"
                    />
                  </div>
                </div>

                {/* Ciudad */}
                <div className="sm:col-span-5">
                  <label className="text-ink mb-1.5 block font-semibold">
                    Ciudad / Municipio
                  </label>
                  <input
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    placeholder="Ej. Bogotá D.C."
                    className="border-line bg-canvas text-ink focus:border-primary focus:ring-primary/20 h-10 w-full rounded-xl border px-3 text-xs outline-none focus:ring-2"
                  />
                </div>

                {/* Régimen / Responsabilidad Fiscal */}
                <div className="sm:col-span-6">
                  <label className="text-ink mb-1.5 block font-semibold">
                    Responsabilidad Tributaria / Régimen
                  </label>
                  <select
                    value={regimenFiscal}
                    onChange={(e) => setRegimenFiscal(e.target.value)}
                    className="border-line bg-canvas text-ink focus:border-primary focus:ring-primary/20 h-10 w-full cursor-pointer rounded-xl border px-3 text-xs outline-none focus:ring-2"
                  >
                    <option value="Responsable de IVA (Régimen Común)">
                      Responsable de IVA (Régimen Común)
                    </option>
                    <option value="Régimen Simple de Tributación (RST)">
                      Régimen Simple de Tributación (RST)
                    </option>
                    <option value="Autorretenedor / Gran Contribuyente">
                      Autorretenedor / Gran Contribuyente
                    </option>
                    <option value="No Responsable de IVA">No Responsable de IVA</option>
                  </select>
                </div>

                {/* Observaciones */}
                <div className="sm:col-span-6">
                  <label className="text-ink mb-1.5 block font-semibold">
                    Orden de Compra / Notas de Facturación
                  </label>
                  <input
                    type="text"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Ej. OC-2026-4412 · Incluir detalle de noches"
                    className="border-line bg-canvas text-ink focus:border-primary focus:ring-primary/20 h-10 w-full rounded-xl border px-3 text-xs outline-none focus:ring-2"
                  />
                </div>
              </div>

              {/* Pie del modal */}
              <div className="border-line flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <div>
                  {initialData && onRemove && (
                    <button
                      type="button"
                      onClick={() => {
                        onRemove(personKey)
                        onClose()
                      }}
                      className="text-danger hover:bg-danger/10 inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} className="size-3" />
                      <span>Quitar empresa</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="border-line bg-canvas text-ink hover:bg-panel cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-primary inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:opacity-90"
                  >
                    <FontAwesomeIcon icon={faCheck} className="size-3.5" />
                    <span>Guardar datos para Factura Electrónica</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
