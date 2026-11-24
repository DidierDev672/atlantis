export type RecepcionesTabKey = 'lista' | 'salidas' | 'nuevo';

export function getRecepcionesTabId(
  baseId: string,
  key: RecepcionesTabKey
): string {
  return `${baseId}-tab-${key}`;
}

export function getRecepcionesPanelId(
  baseId: string,
  key: RecepcionesTabKey
): string {
  return `${baseId}-panel-${key}`;
}
