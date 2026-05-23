"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal";

import buildingsMetadata from "@/data/buildings-metadata.json";
import coursesData from "@/data/courses/courses-latest.json";
import manifestData from "@/data/courses/manifest.json";
import { parseCourseSections, groupByRoom } from "@/lib/parse-courses";
import { getRoomRestrictions } from "@/lib/data-loader";
import { BuildingMetadata, PartOfTerm, DayOfWeek, RoomData } from "@/types";
import { getAssetPath } from "@/lib/utils";
import { useTimeState } from "@/lib/time-state";
import { getClosureStatus } from "@/lib/closures";

const DAY_NAMES: Record<string, string> = {
  L: "Lunes",
  M: "Martes",
  I: "Miércoles",
  J: "Jueves",
  V: "Viernes",
  S: "Sábado",
};

const DAY_ORDER: DayOfWeek[] = ["L", "M", "I", "J", "V", "S"];
const SUNSET_MODAL_STORAGE_KEY = "sunsetModalEnabled";

const getSunsetEnabledPreference = () => {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SUNSET_MODAL_STORAGE_KEY) !== "false";
};

function getCurrentDayCode(): DayOfWeek {
  const dayIndex = new Date().getDay();
  const map: DayOfWeek[] = ["D", "L", "M", "I", "J", "V", "S"];
  return map[dayIndex] || "L";
}

function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function isRoomAvailableNow(
  room: RoomData,
  day: DayOfWeek,
  time: string,
  ptrm: PartOfTerm | "all"
): boolean {
  if (room.isRestricted) return false;
  const occupancies = room.occupancies.filter((occ) => {
    if (occ.day !== day) return false;
    if (ptrm !== "all" && occ.ptrm !== ptrm && occ.ptrm !== "1") return false;
    return true;
  });
  for (const occ of occupancies) {
    if (time >= occ.startTime && time < occ.endTime) return false;
    // 10-minute gap rule: transition time between classes
    const gapEnd = addMinutes(occ.endTime, CLASS_TRANSITION_MINUTES);
    if (time >= occ.endTime && time < gapEnd) return false;
  }
  return true;
}

// Classes end 10 minutes before the next slot to allow students to move between classrooms
const CLASS_TRANSITION_MINUTES = 10;

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function BuildingsPage() {
  return (
    <Suspense>
      <BuildingsPageInner />
    </Suspense>
  );
}

function BuildingsPageInner() {
  const searchParams = useSearchParams();
  const shouldOpenConfigFromQuery = searchParams.get("config") === "1";
  const allBuildings = buildingsMetadata.buildings as BuildingMetadata[];
  const whitelisted = allBuildings.filter((b) => b.order !== undefined).sort((a, b) => (a.order || 0) - (b.order || 0));

  const [sunsetEnabled, setSunsetEnabled] = useState(getSunsetEnabledPreference);
  const [sunsetDismissed, setSunsetDismissed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showConfig, setShowConfig] = useState(shouldOpenConfigFromQuery);
  const [extraBuildings, setExtraBuildings] = useState<Set<string>>(new Set());

  const {
    selectedDay,
    selectedTime,
    selectedCiclo,
    isAutoTime,
    showRestricted,
    handleDayChange,
    handleTimeChange,
    handleCicloChange,
    handleGoToNow,
    handleShowRestrictedChange,
    buildLinkQuery,
  } = useTimeState();

  const showSunset = sunsetEnabled && !sunsetDismissed;
  // Check if university is closed
  const closureStatus = getClosureStatus(selectedDay, selectedTime);

  // Parse courses and compute availability
  const sections = parseCourseSections(coursesData as any[]);
  const restrictions = getRoomRestrictions();
  const buildingsData = groupByRoom(sections, allBuildings, restrictions);

  // Non-whitelisted buildings that have courses
  const nonWhitelisted = allBuildings.filter(
    (b) => b.order === undefined && buildingsData.some((bd) => bd.building === b.code)
  );

  // Combined list: whitelisted + user-selected extra
  const visibleBuildings = [
    ...whitelisted,
    ...nonWhitelisted.filter((b) => extraBuildings.has(b.code)),
  ];

  // Compute available rooms per building
  const buildingStats = new Map<string, { total: number; available: number }>();
  for (const bd of buildingsData) {
    const unrestricted = bd.rooms.filter((r) => !r.isRestricted);
    const available = unrestricted.filter((r) => isRoomAvailableNow(r, selectedDay, selectedTime, selectedCiclo));
    const total = showRestricted ? bd.rooms.length : unrestricted.length;
    buildingStats.set(bd.building, { total, available: available.length });
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-uniandes-dark text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-uniandes-yellow flex items-center justify-center font-bold text-uniandes-dark text-sm">
              AF
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Aula-Finder</h1>
              <p className="text-xs text-white/70">Universidad de los Andes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/map${buildLinkQuery()}`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 text-white hover:bg-white/10 transition-colors"
              title="Mapa del campus"
              aria-label="Ver mapa del campus"
            >
              🗺️
            </Link>
            <Link
              href="https://dashboard.openpanel.dev/share/overview/hQ9bOd"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 text-white hover:bg-white/10 transition-colors"
              title="Ver analíticas"
              aria-label="Ver analíticas de OpenPanel"
            >
              📊
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfig(true)}
              className="text-white hover:bg-white/10"
              aria-label="Abrir configuración"
            >
              ⚙️
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(true)}
              className="text-white hover:bg-white/10"
              aria-label="Abrir ayuda"
            >
              ❓
            </Button>
          </div>
        </div>
      </header>

      {/* Time & Day Selector Bar */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Day selector */}
            <div className="flex gap-1" role="group" aria-label="Selector de día de la semana">
              {DAY_ORDER.map((day) => (
                <button
                  key={day}
                  onClick={() => handleDayChange(day)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedDay === day
                      ? "bg-uniandes-yellow text-uniandes-dark"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                  aria-label={`Seleccionar ${DAY_NAMES[day]}`}
                  aria-pressed={selectedDay === day}
                >
                  {DAY_NAMES[day]?.slice(0, 3)}
                </button>
              ))}
            </div>

            {/* Time selector */}
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="px-3 py-1.5 rounded-lg border bg-background text-sm"
                aria-label="Seleccionar hora"
              />
              <button
                onClick={() => {
                  handleGoToNow();
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isAutoTime
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
                aria-label={isAutoTime ? "Hora actual activa" : "Ir a la hora actual"}
              >
                {isAutoTime ? "🟢 Ahora" : "📍 Ir a ahora"}
              </button>
            </div>

            {/* Ciclo selector */}
            <select
              value={selectedCiclo}
              onChange={(e) => handleCicloChange(e.target.value as PartOfTerm | "all")}
              className="px-3 py-1.5 rounded-lg border bg-background text-sm"
              aria-label="Seleccionar ciclo académico"
            >
              <option value="all">Todos los ciclos</option>
              <option value="1">Semestre completo</option>
              <option value="8A">Ciclo 8A (1ª mitad)</option>
              <option value="8B">Ciclo 8B (2ª mitad)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Buildings Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {closureStatus.isClosed && (
          <div className="mb-6 p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <span>🚫</span>
              <span>Universidad cerrada</span>
            </div>
            <p className="text-xs mt-1 text-amber-800">{closureStatus.reason}</p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {visibleBuildings.map((building) => {
            const stats = buildingStats.get(building.code);
            const hasAvailable = stats ? stats.available > 0 : false;
            const isInactive = closureStatus.isClosed || (stats ? stats.available === 0 && stats.total > 0 : false);

            return (
              <Link
                key={building.code}
                href={`/building/${building.code}${buildLinkQuery()}`}
                className="group"
                aria-label={`Ver salones del edificio ${building.name}`}
              >
                <Card className={`overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] ${
                  isInactive ? "opacity-50 grayscale" : ""
                }`}>
                  <div className="relative aspect-[4/3] w-full bg-muted">
                    <Image
                      src={getAssetPath(building.imageUrl || buildingsMetadata.defaultImage)}
                      alt={building.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    />
                    {/* Available rooms badge */}
                    {stats && (
                      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                        hasAvailable
                          ? "bg-green-500 text-white"
                          : "bg-red-500/80 text-white"
                      }`}>
                        {stats.available}/{stats.total}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <div className="font-semibold text-sm truncate">{building.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{building.code}</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Data info */}
        <div className="mt-6 text-center text-xs text-muted-foreground space-y-1">
          <div>
            Datos del semestre {manifestData.term} · Actualizado: {new Date(manifestData.timestamp).toLocaleDateString("es-CO")}
            {" · "}{manifestData.totalSections} secciones
          </div>
          <div className="max-w-xl mx-auto">
            La información se basa únicamente en la oferta de cursos actualizada a esa fecha.
            Si conoces de algún evento que ocupe salones o de un cambio de salón,{" "}
            <a
              href="https://github.com/Open-Source-Uniandes/Aula-Finder/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-uniandes-yellow underline"
            >
              crea un issue
            </a>.
          </div>
        </div>
      </div>

      {/* Sunset Modal */}
      <Modal open={showSunset} onOpenChange={(open) => setSunsetDismissed(!open)}>
        <ModalContent className="max-h-[80vh] overflow-y-auto border-amber-200">
          <ModalHeader>
            <ModalTitle>Estamos migrando a la plataforma oficial</ModalTitle>
          </ModalHeader>
          <div className="mt-4 space-y-4 text-sm">
            <p className="text-muted-foreground">
              Aula Finder fue un proyecto creado por estudiantes para facilitar la búsqueda de salones y espacios en
              Uniandes.
            </p>
            <p className="text-muted-foreground">
              Ahora, la universidad cuenta con una plataforma oficial donde podrán consultar y reservar salones
              directamente:
            </p>
            <p>
              <a
                href="https://serviciosalaulayauditorios.bookeau.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-uniandes-yellow underline"
              >
                serviciosalaulayauditorios.bookeau.com
              </a>
            </p>
            <p className="text-muted-foreground">
              Les recomendamos comenzar a usar este nuevo sistema, ya que será la fuente oficial y más actualizada de
              disponibilidad de espacios en el campus.
            </p>
            <p className="text-muted-foreground">
              Aula Finder continuará disponible como proyecto open source y archivo histórico de la comunidad, pero ya
              no tendrá mantenimiento activo y parte de la información podría quedar desactualizada con el tiempo.
            </p>
            <p className="text-muted-foreground">
              Gracias a todas las personas que usaron, compartieron y contribuyeron al proyecto durante estos años.
            </p>
            <p className="text-muted-foreground">— Equipo de Open Source Uniandes</p>
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={!sunsetEnabled}
              onChange={(e) => {
                const nextEnabled = !e.target.checked;
                setSunsetEnabled(nextEnabled);
                localStorage.setItem(SUNSET_MODAL_STORAGE_KEY, String(nextEnabled));
                if (!nextEnabled) setSunsetDismissed(true);
              }}
              className="rounded"
            />
            <span>No volver a mostrar este aviso</span>
          </label>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <a
              href="https://serviciosalaulayauditorios.bookeau.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-uniandes-dark px-4 py-2 text-sm font-medium text-white hover:bg-uniandes-dark/90 transition-colors"
            >
              Ir a la plataforma oficial
            </a>
            <button
              onClick={() => setSunsetDismissed(true)}
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-uniandes-dark px-4 py-2 text-sm font-medium text-uniandes-dark hover:bg-uniandes-dark/10 transition-colors"
              aria-label="Cerrar aviso de migración"
            >
              Continuar en Aula-Finder
            </button>
          </div>
        </ModalContent>
      </Modal>

      {/* Help Modal */}
      <Modal open={showHelp} onOpenChange={setShowHelp}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Acerca de Aula-Finder</ModalTitle>
          </ModalHeader>
          <div className="mt-4 space-y-4 text-sm">
            <p>
              <strong>Aula-Finder</strong> te ayuda a encontrar aulas disponibles en el campus de la
              Universidad de los Andes en tiempo real.
            </p>
            <div>
              <h3 className="font-semibold mb-1">¿Cómo funciona?</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Selecciona un edificio para ver sus salones organizados por piso</li>
                <li>El badge verde/rojo muestra cuántos salones están libres</li>
                <li>Haz clic en un salón para ver su calendario semanal</li>
                <li>Usa los filtros de día, hora y ciclo para ajustar la búsqueda</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-1">¿Encontraste un error?</h3>
              <p className="text-muted-foreground">
                Reporta problemas o propone nuevas ideas creando un{" "}
                <a
                  href="https://github.com/Open-Source-Uniandes/Aula-Finder/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-uniandes-yellow underline"
                >
                  issue en GitHub
                </a>.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Contribuir</h3>
              <p className="text-muted-foreground">
                Este es un proyecto de{" "}
                <a
                  href="https://github.com/Open-Source-Uniandes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-uniandes-yellow underline"
                >
                  Open Source Uniandes
                </a>. ¡Todas las contribuciones son bienvenidas!
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="mt-6 w-full px-4 py-2 bg-uniandes-dark text-white rounded-lg hover:bg-uniandes-dark/90 transition-colors"
            aria-label="Cerrar modal de ayuda"
          >
            Cerrar
          </button>
        </ModalContent>
      </Modal>

      {/* Config Modal */}
      <Modal open={showConfig} onOpenChange={setShowConfig}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Configuración</ModalTitle>
          </ModalHeader>
          <div className="mt-4 space-y-4">
            {/* Sunset modal toggle */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Aviso de migración</h3>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={sunsetEnabled}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setSunsetEnabled(next);
                    localStorage.setItem(SUNSET_MODAL_STORAGE_KEY, String(next));
                    setSunsetDismissed(!next);
                  }}
                  className="rounded"
                />
                <span>Mostrar aviso al abrir la aplicación</span>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Puedes desactivar el modal de migración en cualquier momento.
              </p>
            </div>
            {/* Show restricted rooms toggle */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Visibilidad de salones</h3>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRestricted}
                  onChange={(e) => handleShowRestrictedChange(e.target.checked)}
                  className="rounded"
                />
                <span>Mostrar salones con restricciones</span>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Incluye laboratorios y salones de acceso restringido en la lista.
              </p>
            </div>
            {/* Extra buildings toggle */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Edificios adicionales</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Los edificios principales ya se muestran. Activa edificios adicionales que quieras ver:
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {nonWhitelisted.map((building) => (
                  <label key={building.code} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={extraBuildings.has(building.code)}
                      onChange={(e) => {
                        const next = new Set(extraBuildings);
                        if (e.target.checked) next.add(building.code);
                        else next.delete(building.code);
                        setExtraBuildings(next);
                      }}
                      className="rounded"
                    />
                    <span>{building.code} - {building.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowConfig(false)}
            className="mt-6 w-full px-4 py-2 bg-uniandes-dark text-white rounded-lg hover:bg-uniandes-dark/90 transition-colors"
            aria-label="Cerrar modal de configuración"
          >
            Cerrar
          </button>
        </ModalContent>
      </Modal>
    </main>
  );
}
