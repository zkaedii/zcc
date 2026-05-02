
    const ROW_COUNT = 42;
    const MAX_ENTITIES = 600;
    const MAX_CELL_ABS = 1e6;
    const MAX_TEXT_CHARS = 500000;
    const SAFE_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]{0,31}$/;
    const LS_PIN_GROUPS_KEY = "svg42_pin_groups_v1";
    const LS_PINS_KEY = "svg42_pinned_ids_v1";
    const LS_HUD_KEY = "svg42:hud";
    const LS_ANNOTATIONS_KEY = "svg42:annotations";
    const LS_DRAFT_KEY = "svg42_draft_v1";
    const LS_SNAPSHOTS_KEY = "svg42_snapshots_v1";
    const LS_THEME_KEY = "svg42_theme_v1";
    const LS_TIMELINE_KEY = "svg42_timeline_v1";
    const LS_CUSTOM_MACROS_KEY = "svg42_custom_macros_v1";
    const MAX_CUSTOM_MACROS = 32;
    const MAX_CUSTOM_MACRO_BYTES = 4000;
    const MAX_FRAME_COUNT = 120;
    const DRAFT_DEBOUNCE_MS = 1400;
    const DRAFT_MAX_BYTES = 200000;
    const MAX_PIN_GROUP_NAME_LEN = 48;
    const MAX_PIN_GROUP_COUNT = 64;
    const MAX_PIN_IDS_PER_GROUP = 200;
    const MAX_PIN_STORAGE_BYTES = 256000;
    const MAX_SNAPSHOT_COUNT = 24;
    const MAX_SNAPSHOT_NAME_LEN = 48;
    const MAX_SNAPSHOT_STORAGE_BYTES = 1024 * 1024;
    const STAGE_ZOOM_MIN = 0.25;
    const STAGE_ZOOM_MAX = 6;
    const STAGE_VIEW_W = 1200;
    const STAGE_VIEW_H = 900;
    const TIMELINE_DEFAULT_LOOP = 60;
    const PHASE2_DEFAULT = [
      "# Phase 2 scene script",
      "entities 120",
      "preset mandala",
      "wave 1 340 2.7 0",
      "wave 2 250 3.4 1.2",
      "set 4 1.2",
      "set 8 2",
      "set 10 9",
      "noise 18 220",
      "set 19 76",
      "set 20 52",
      "set 30 1.0",
      "set 33 2.0",
      "set 34 2.2",
      "quantize rot 24",
      "mirror x 0"
    ].join("\n");
    const PHASE3_DEFAULT = [
      "# Phase 3 pass pipeline",
      "macro cinematic",
      "clamp life 0 1",
      "gain scale 1.05",
      "bias hue 12",
      "sort z asc"
    ].join("\n");
    const DEFAULT_DSL = [
      "1 x -500 500 linear",
      "2 y -500 500 linear",
      "3 z -1 1 linear",
      "4 scale 0.1 4 linear",
      "5 rot 0 360 wrap360",
      "6 pivotX -200 200 linear",
      "7 pivotY -200 200 linear",
      "8 shapeId 0 4 enum",
      "9 shapeVariant 0 8 enum",
      "10 segments 3 24 enum",
      "11 roundness 0 1 clamp01",
      "12 innerRatio 0 1 clamp01",
      "13 aspectX 0.2 3 linear",
      "14 aspectY 0.2 3 linear",
      "15 strokeW 0 6 linear",
      "16 strokeAlpha 0 1 clamp01",
      "17 fillAlpha 0 1 clamp01",
      "18 hue 0 360 wrap360",
      "19 sat 0 100 linear",
      "20 light 0 100 linear",
      "21 paletteSlot 0 7 enum",
      "22 blur 0 8 linear",
      "23 glow 0 1 clamp01",
      "24 blendModeId 0 5 enum",
      "25 noiseAmt 0 80 linear",
      "26 pixelate 0 1 clamp01",
      "27 trail 0 1 clamp01",
      "28 maskId 0 3 enum",
      "29 phase 0 6.283185 linear",
      "30 speed -3 3 linear",
      "31 ampX 0 260 linear",
      "32 ampY 0 260 linear",
      "33 freqX 0 6 linear",
      "34 freqY 0 6 linear",
      "35 rotSpeed -140 140 linear",
      "36 vx -3 3 linear",
      "37 vy -3 3 linear",
      "38 ax -0.1 0.1 linear",
      "39 ay -0.1 0.1 linear",
      "40 attract -1 1 linear",
      "41 repel -1 1 linear",
      "42 life 0 1 clamp01"
    ].join("\n");

    const DEFAULT_NAMES = DEFAULT_DSL.split("\n").map((line) => line.split(/\s+/)[1]);
    const MODES = new Set(["linear", "wrap360", "clamp01", "enum"]);

    const ui = {
      builderDsl: document.getElementById("builderDsl"),
      renameChannelFrom: document.getElementById("renameChannelFrom"),
      renameChannelTo: document.getElementById("renameChannelTo"),
      btnRenameChannel: document.getElementById("btnRenameChannel"),
      renameStatus: document.getElementById("renameStatus"),
      matrixInput: document.getElementById("matrixInput"),
      dslStatus: document.getElementById("dslStatus"),
      compileStatus: document.getElementById("compileStatus"),
      info: document.getElementById("info"),
      stage: document.getElementById("stage"),
      entityCount: document.getElementById("entityCount"),
      seed: document.getElementById("seed"),
      profile: document.getElementById("profile"),
      phase2Input: document.getElementById("phase2Input"),
      phase3Input: document.getElementById("phase3Input"),
      phase3Trace: document.getElementById("phase3Trace"),
      phase3Diff: document.getElementById("phase3Diff"),
      checkpointSelect: document.getElementById("checkpointSelect"),
      btnCheckpointPlay: document.getElementById("btnCheckpointPlay"),
      checkpointDwell: document.getElementById("checkpointDwell"),
      checkpointPingpong: document.getElementById("checkpointPingpong"),
      checkpointReverse: document.getElementById("checkpointReverse"),
      deltaChannel: document.getElementById("deltaChannel"),
      deltaMode: document.getElementById("deltaMode"),
      deltaLegend: document.getElementById("deltaLegend"),
      plotChannel: document.getElementById("plotChannel"),
      entityInspector: document.getElementById("entityInspector"),
      pinnedInspector: document.getElementById("pinnedInspector"),
      pinGroupName: document.getElementById("pinGroupName"),
      pinGroupSelect: document.getElementById("pinGroupSelect"),
      limitsReadout: document.getElementById("limitsReadout"),
      deltaHeatOnB: document.getElementById("deltaHeatOnB"),
      entityJumpId: document.getElementById("entityJumpId"),
      pinGroupImportReplace: document.getElementById("pinGroupImportReplace"),
      bonusStatus: document.getElementById("bonusStatus"),
      checkpointScrub: document.getElementById("checkpointScrub"),
      autoPreviewScrub: document.getElementById("autoPreviewScrub"),
      abSwapPanes: document.getElementById("abSwapPanes"),
      draftHint: document.getElementById("draftHint"),
      themeSelect: document.getElementById("themeSelect"),
      btnShareLink: document.getElementById("btnShareLink"),
      btnHudToggle: document.getElementById("btnHudToggle"),
      stageHud: document.getElementById("stageHud"),
      btnHelpDrawer: document.getElementById("btnHelpDrawer"),
      helpDrawer: document.getElementById("helpDrawer"),
      btnCheatsheet: document.getElementById("btnCheatsheet"),
      btnCommandPalette: document.getElementById("btnCommandPalette"),
      btnExamples: document.getElementById("btnExamples"),
      lnkPhase4: document.getElementById("lnkPhase4"),
      pageStrapProv: document.getElementById("pageStrapProv"),
      pageStrapProvLabel: document.getElementById("pageStrapProvLabel"),
      pageStrapProvDismiss: document.getElementById("pageStrapProvDismiss"),
      btnSaveCopy: document.getElementById("btnSaveCopy"),
      commandPaletteOverlay: document.getElementById("commandPaletteOverlay"),
      commandPalette: document.getElementById("commandPalette"),
      paletteInput: document.getElementById("paletteInput"),
      paletteResults: document.getElementById("paletteResults"),
      paletteCount: document.getElementById("paletteCount"),
      cheatsheetPopover: document.getElementById("cheatsheetPopover"),
      toast: document.getElementById("toast"),
      btnTimelinePlay: document.getElementById("btnTimelinePlay"),
      btnTimelineRewind: document.getElementById("btnTimelineRewind"),
      timeScrub: document.getElementById("timeScrub"),
      timeReadout: document.getElementById("timeReadout"),
      timelineFps: document.getElementById("timelineFps"),
      timelineLoop: document.getElementById("timelineLoop"),
      overlaysFollowTime: document.getElementById("overlaysFollowTime"),
      showConstellation: document.getElementById("showConstellation"),
      showPinLabels: document.getElementById("showPinLabels"),
      btnStageFitReset: document.getElementById("btnStageFitReset"),
      btnDownloadPng: document.getElementById("btnDownloadPng"),
      channelAtlas: document.getElementById("channelAtlas"),
      histogramBins: document.getElementById("histogramBins"),
      btnRefreshAtlas: document.getElementById("btnRefreshAtlas"),
      btnAtlasCopy: document.getElementById("btnAtlasCopy"),
      atlasFilterStatus: document.getElementById("atlasFilterStatus"),
      btnAtlasFilterClear: document.getElementById("btnAtlasFilterClear"),
      btnAtlasFilterPin: document.getElementById("btnAtlasFilterPin"),
      atlasFilterDim: document.getElementById("atlasFilterDim"),
      atlasOutliers: document.getElementById("atlasOutliers"),
      atlasOutlierSigma: document.getElementById("atlasOutlierSigma"),
      atlasOutlierChannel: document.getElementById("atlasOutlierChannel"),
      scatterX: document.getElementById("scatterX"),
      scatterY: document.getElementById("scatterY"),
      scatterColor: document.getElementById("scatterColor"),
      scatterSize: document.getElementById("scatterSize"),
      scatterLogX: document.getElementById("scatterLogX"),
      scatterLogY: document.getElementById("scatterLogY"),
      scatterTrend: document.getElementById("scatterTrend"),
      btnScatterRefresh: document.getElementById("btnScatterRefresh"),
      btnScatterPinSel: document.getElementById("btnScatterPinSel"),
      btnScatterClearSel: document.getElementById("btnScatterClearSel"),
      scatterCanvas: document.getElementById("scatterCanvas"),
      scatterStatus: document.getElementById("scatterStatus"),
      scatterStats: document.getElementById("scatterStats"),
      paletteSelect: document.getElementById("paletteSelect"),
      paletteName: document.getElementById("paletteName"),
      btnPaletteSave: document.getElementById("btnPaletteSave"),
      btnPaletteDelete: document.getElementById("btnPaletteDelete"),
      btnPaletteApply: document.getElementById("btnPaletteApply"),
      btnPaletteRandom: document.getElementById("btnPaletteRandom"),
      btnPaletteRotate: document.getElementById("btnPaletteRotate"),
      paletteStops: document.getElementById("paletteStops"),
      paletteBase: document.getElementById("paletteBase"),
      paletteSat: document.getElementById("paletteSat"),
      paletteLight: document.getElementById("paletteLight"),
      paletteSwatches: document.getElementById("paletteSwatches"),
      paletteStatus: document.getElementById("paletteStatus"),
      diffMatrixChannel: document.getElementById("diffMatrixChannel"),
      diffMatrixMetric: document.getElementById("diffMatrixMetric"),
      btnDiffMatrixRefresh: document.getElementById("btnDiffMatrixRefresh"),
      diffMatrix: document.getElementById("diffMatrix"),
      diffMatrixStatus: document.getElementById("diffMatrixStatus"),
      transferChannel: document.getElementById("transferChannel"),
      btnTransferReset: document.getElementById("btnTransferReset"),
      btnTransferInvert: document.getElementById("btnTransferInvert"),
      btnTransferEase: document.getElementById("btnTransferEase"),
      btnTransferStep: document.getElementById("btnTransferStep"),
      btnTransferApply: document.getElementById("btnTransferApply"),
      btnTransferEmit: document.getElementById("btnTransferEmit"),
      transferCanvas: document.getElementById("transferCanvas"),
      transferStats: document.getElementById("transferStats"),
      transferStatus: document.getElementById("transferStatus"),
      frameStripCount: document.getElementById("frameStripCount"),
      frameStripSpan: document.getElementById("frameStripSpan"),
      btnFrameStripRefresh: document.getElementById("btnFrameStripRefresh"),
      frameStrip: document.getElementById("frameStrip"),
      frameStripStatus: document.getElementById("frameStripStatus"),
      btnMacroRecToggle: document.getElementById("btnMacroRecToggle"),
      btnMacroRecClear: document.getElementById("btnMacroRecClear"),
      macroRecordName: document.getElementById("macroRecordName"),
      btnMacroRecSave: document.getElementById("btnMacroRecSave"),
      btnMacroRecAppendP3: document.getElementById("btnMacroRecAppendP3"),
      macroRecorderBuffer: document.getElementById("macroRecorderBuffer"),
      macroRecorderStatus: document.getElementById("macroRecorderStatus"),
      snapshotName: document.getElementById("snapshotName"),
      snapshotList: document.getElementById("snapshotList"),
      snapshotMeta: document.getElementById("snapshotMeta"),
      snapshotDiff: document.getElementById("snapshotDiff"),
      snapshotImportFile: document.getElementById("snapshotImportFile"),
      btnSnapshotSave: document.getElementById("btnSnapshotSave"),
      btnSnapshotExportAll: document.getElementById("btnSnapshotExportAll"),
      btnSnapshotImportAll: document.getElementById("btnSnapshotImportAll"),
      btnSnapshotClear: document.getElementById("btnSnapshotClear"),
      searchExpr: document.getElementById("searchExpr"),
      btnSearchRun: document.getElementById("btnSearchRun"),
      btnSearchClear: document.getElementById("btnSearchClear"),
      btnSearchPin: document.getElementById("btnSearchPin"),
      btnSearchUnpin: document.getElementById("btnSearchUnpin"),
      btnSearchSelect: document.getElementById("btnSearchSelect"),
      searchStatus: document.getElementById("searchStatus"),
      searchResults: document.getElementById("searchResults"),
      customMacroName: document.getElementById("customMacroName"),
      customMacroBody: document.getElementById("customMacroBody"),
      customMacroSelect: document.getElementById("customMacroSelect"),
      customMacroStatus: document.getElementById("customMacroStatus"),
      customMacroCount: document.getElementById("customMacroCount"),
      btnCustomMacroSave: document.getElementById("btnCustomMacroSave"),
      btnCustomMacroLoad: document.getElementById("btnCustomMacroLoad"),
      btnCustomMacroInsert: document.getElementById("btnCustomMacroInsert"),
      btnCustomMacroDelete: document.getElementById("btnCustomMacroDelete"),
      // Prime Lab — Hamiltonian-flow DSL emitter (panel is an input device for
      // the Phase 3 textarea, not a parallel control plane; see designer notes).
      primeLabStatus: document.getElementById("primeLabStatus"),
      primeLabMode: document.getElementById("primeLabMode"),
      primeLabOrder: document.getElementById("primeLabOrder"),
      primeLabDt: document.getElementById("primeLabDt"),
      primeLabKappa: document.getElementById("primeLabKappa"),
      primeLabKappaVal: document.getElementById("primeLabKappaVal"),
      primeLabEta: document.getElementById("primeLabEta"),
      primeLabEtaVal: document.getElementById("primeLabEtaVal"),
      primeLabEps: document.getElementById("primeLabEps"),
      primeLabEpsVal: document.getElementById("primeLabEpsVal"),
      primeLabSteps: document.getElementById("primeLabSteps"),
      btnPrimeLabAppendEvolve: document.getElementById("btnPrimeLabAppendEvolve"),
      btnPrimeLabAppendParams: document.getElementById("btnPrimeLabAppendParams"),
      btnPrimeLabReset: document.getElementById("btnPrimeLabReset"),
      primeLabAutoCompile: document.getElementById("primeLabAutoCompile"),
      primeLabEmitTail: document.getElementById("primeLabEmitTail"),
      primeLabDiagParams: document.getElementById("primeLabDiagParams"),
      primeLabDiagStep: document.getElementById("primeLabDiagStep"),
      primeLabDiagH: document.getElementById("primeLabDiagH"),
      primeLabDiagK: document.getElementById("primeLabDiagK"),
      primeLabDiagVpair: document.getElementById("primeLabDiagVpair"),
      primeLabDiagVconf: document.getElementById("primeLabDiagVconf"),
      primeLabDiagLz: document.getElementById("primeLabDiagLz"),
      primeLabDiagP: document.getElementById("primeLabDiagP"),
      primePortraitStatus: document.getElementById("primePortraitStatus"),
      primePortraitEntities: document.getElementById("primePortraitEntities"),
      primePortraitSteps: document.getElementById("primePortraitSteps"),
      btnPrimePortraitTrace: document.getElementById("btnPrimePortraitTrace"),
      btnPrimePortraitClear: document.getElementById("btnPrimePortraitClear"),
      primePortraitCanvas: document.getElementById("primePortraitCanvas"),
      primePortraitLegend: document.getElementById("primePortraitLegend"),
      phase3DryLine: document.getElementById("phase3DryLine"),
      btnPhase3Dry: document.getElementById("btnPhase3Dry"),
      btnPhase3DryAppend: document.getElementById("btnPhase3DryAppend"),
      phase3DryStatus: document.getElementById("phase3DryStatus"),
      phase2DryLine: document.getElementById("phase2DryLine"),
      btnPhase2Dry: document.getElementById("btnPhase2Dry"),
      btnPhase2DryAppend: document.getElementById("btnPhase2DryAppend"),
      phase2DryStatus: document.getElementById("phase2DryStatus"),
      phase3Timing: document.getElementById("phase3Timing"),
      corrChannels: document.getElementById("corrChannels"),
      btnCorrRefresh: document.getElementById("btnCorrRefresh"),
      corrMatrix: document.getElementById("corrMatrix"),
      frameCount: document.getElementById("frameCount"),
      frameStep: document.getElementById("frameStep"),
      btnFrameExport: document.getElementById("btnFrameExport"),
      overlayCentroid: document.getElementById("overlayCentroid"),
      overlayBbox: document.getElementById("overlayBbox"),
      overlayGrid: document.getElementById("overlayGrid"),
      overlayHeatmap: document.getElementById("overlayHeatmap"),
      minimap: document.getElementById("minimap"),
      minimapEnabled: document.getElementById("minimapEnabled"),
      pinTrimChannel: document.getElementById("pinTrimChannel"),
      pinTrimN: document.getElementById("pinTrimN"),
      pinTrimDir: document.getElementById("pinTrimDir"),
      btnPinTrim: document.getElementById("btnPinTrim"),
      btnPinAdd: document.getElementById("btnPinAdd"),
      btnPinInvert: document.getElementById("btnPinInvert"),
      btnPinHalve: document.getElementById("btnPinHalve"),
      pinToolkitStatus: document.getElementById("pinToolkitStatus"),
      pinToolkitCount: document.getElementById("pinToolkitCount"),
      pinGroupChips: document.getElementById("pinGroupChips"),
      btnPinGroupShowAll: document.getElementById("btnPinGroupShowAll"),
      btnPinGroupHideAll: document.getElementById("btnPinGroupHideAll"),
      entityAnnotation: document.getElementById("entityAnnotation"),
      entityAnnotationInput: document.getElementById("entityAnnotationInput"),
      entityAnnotationStatus: document.getElementById("entityAnnotationStatus")
    };

    let schema = [];
    let ir = null;
    let previewIr = null;
    let abCompare = false;
    let selectedEntityId = null;
    let pinHighlightOn = true;
    const pinnedEntityIds = new Set();
    const pinGroups = new Map();
    let lastSvg = "";
    let runtimeHtml = "";
    let transientJumpId = null;
    let jumpFlashTimer = null;
    let draftSaveTimer = null;
    let stageTime = 0;
    let timelinePlaying = false;
    let timelineLastTs = 0;
    let timelineRafId = 0;
    const snapshots = new Map();
    let stageZoom = 1;
    let stagePanX = 0;
    let stagePanY = 0;
    let stagePanning = false;
    let stagePanStart = null;
    let stageBrushing = false;
    let stageBrushStart = null;
    let stageBrushEl = null;
    let toastTimer = null;
    let lastClickEid = null;
    let cheatsheetOpen = false;
    const customMacros = new Map();
    let lastSearchIds = [];
    const atlasFilters = new Map();
    let atlasBrushing = null;
    let lastFrameMs = 0;
    let smoothedFps = 0;
    let lastRenderMs = 0;
    let stageHudShown = false;
    let lastUrlHashSig = "";
    const pinGroupVisibility = new Map();
    const entityAnnotations = new Map();
    let checkpointPlayer = null;
    let checkpointPlayerDir = 1;
    const scatterSelection = new Set();
    let scatterBrushing = null;
    let scatterPointMap = [];
    const palettes = new Map();
    let activePaletteName = null;
    let transferPoints = [
      { x: 0, y: 0 },
      { x: 0.25, y: 0.25 },
      { x: 0.5, y: 0.5 },
      { x: 0.75, y: 0.75 },
      { x: 1, y: 1 }
    ];
    let transferDragIdx = -1;
    let macroRecording = false;
    const macroRecorderLines = [];
    const LS_PALETTES_KEY = "svg42:palettes";
    const LS_TRANSFER_KEY = "svg42:transfer";
    const LS_MACRO_REC_KEY = "svg42:macroRec";
    const SCATTER_W = 360;
    const SCATTER_H = 220;
    const SCATTER_PAD = 28;
    const TRANSFER_W = 360;
    const TRANSFER_H = 140;
    const TRANSFER_PAD = 14;
    const PALETTE_MAX = 24;
    const TRANSFER_MAX_POINTS = 16;

    function normalizePinGroupName(name) {
      const s = String(name || "").trim().slice(0, MAX_PIN_GROUP_NAME_LEN);
      if (!s) return "";
      if (!/^[A-Za-z0-9_\- ]+$/.test(s)) return "";
      return s;
    }
    function normalizePinIdList(arr) {
      const out = new Set();
      if (!Array.isArray(arr)) return [];
      for (const x of arr) {
        const n = Math.floor(Number(x));
        if (!Number.isFinite(n) || n < 0 || n >= MAX_ENTITIES) continue;
        out.add(n);
        if (out.size >= MAX_PIN_IDS_PER_GROUP) break;
      }
      return Array.from(out).sort((a, b) => a - b);
    }
    function pinGroupsToJsonPayload() {
      const groups = {};
      for (const [k, v] of pinGroups) groups[k] = v;
      return JSON.stringify({ v: 1, groups, exportedAt: new Date().toISOString() });
    }
    function pinGroupsSetStatus(msg, ok) {
      ui.compileStatus.innerHTML = ok
        ? `<span class="ok">Pin groups:</span> ${escapeHtml(msg)}`
        : `<span class="danger">Pin groups:</span> ${escapeHtml(msg)}`;
    }
    function persistPinGroups(silent) {
      const json = pinGroupsToJsonPayload();
      if (json.length > MAX_PIN_STORAGE_BYTES) {
        if (!silent) pinGroupsSetStatus("export too large for browser storage; delete groups or import smaller set", false);
        return false;
      }
      const ok = safeLocalSet(LS_PIN_GROUPS_KEY, json);
      if (ok && !silent) pinGroupsSetStatus("saved to localStorage.", true);
      else if (!ok) pinGroupsSetStatus("localStorage write failed (quota?)", false);
      return ok;
    }
    function loadPinGroupsFromStorage() {
      pinGroups.clear();
      const data = safeLocalJsonGet(LS_PIN_GROUPS_KEY, null);
      if (!data || typeof data.groups !== "object" || !data.groups) return;
      if (data.v !== undefined && data.v !== 1) return;
      let n = 0;
      for (const [name, ids] of Object.entries(data.groups)) {
        if (n >= MAX_PIN_GROUP_COUNT) break;
        const nk = normalizePinGroupName(name);
        if (!nk) continue;
        const list = normalizePinIdList(ids);
        if (list.length) {
          pinGroups.set(nk, list);
          n += 1;
        }
      }
    }
    function mergePinGroupsFromObject(data, replaceAll) {
      if (!data || typeof data !== "object") return { ok: false, msg: "invalid object" };
      if (data.v !== undefined && data.v !== 1) return { ok: false, msg: "unsupported version" };
      if (replaceAll) pinGroups.clear();
      const src = data.groups;
      if (!src || typeof src !== "object") return { ok: false, msg: "missing groups" };
      let added = 0;
      for (const [name, ids] of Object.entries(src)) {
        if (pinGroups.size >= MAX_PIN_GROUP_COUNT) break;
        const nk = normalizePinGroupName(name);
        if (!nk) continue;
        const list = normalizePinIdList(ids);
        if (list.length) {
          pinGroups.set(nk, list);
          added += 1;
        }
      }
      return { ok: true, msg: `merged ${added} group(s), total ${pinGroups.size}.` };
    }
    function importPinGroupsPayload(parsed, replaceAll) {
      if (!parsed || typeof parsed !== "object") return { ok: false, msg: "invalid JSON" };
      if (parsed.groups && typeof parsed.groups === "object")
        return mergePinGroupsFromObject(parsed, !!replaceAll);
      if (Object.values(parsed).every((v) => Array.isArray(v)))
        return mergePinGroupsFromObject({ v: 1, groups: parsed }, !!replaceAll);
      return { ok: false, msg: "use { v:1, groups: { name: [ids] } } or a flat { name: [ids] } map" };
    }
    function loadPinnedFromStorage() {
      pinnedEntityIds.clear();
      const data = safeLocalJsonGet(LS_PINS_KEY, null);
      const arr = data && data.v === 1 && Array.isArray(data.pinned) ? data.pinned : (Array.isArray(data) ? data : null);
      if (!arr) return;
      for (const x of arr) {
        const n = Math.floor(Number(x));
        if (Number.isFinite(n) && n >= 0 && n < MAX_ENTITIES) pinnedEntityIds.add(n);
        if (pinnedEntityIds.size >= MAX_PIN_IDS_PER_GROUP) break;
      }
    }
    function persistPinned(silent) {
      const list = Array.from(pinnedEntityIds).sort((a, b) => a - b);
      let ok;
      if (list.length) {
        ok = safeLocalSet(LS_PINS_KEY, JSON.stringify({ v: 1, pinned: list, savedAt: new Date().toISOString() }));
      } else {
        ok = safeLocalRemove(LS_PINS_KEY);
      }
      if (!ok && !silent) pinGroupsSetStatus("pinned set: save failed", false);
    }
    function prunePinnedToIr() {
      if (!ir) return;
      const n = ir.entities.length;
      let ch = false;
      for (const id of Array.from(pinnedEntityIds)) {
        if (id < 0 || id >= n) {
          pinnedEntityIds.delete(id);
          ch = true;
        }
      }
      if (ch) persistPinned(true);
    }
    function clearPinGroupStorage() {
      pinGroups.clear();
      safeLocalRemove(LS_PIN_GROUPS_KEY);
    }
    function clearAllPinData() {
      clearPinGroupStorage();
      pinnedEntityIds.clear();
      safeLocalRemove(LS_PINS_KEY);
    }
    function updateLimitsReadout() {
      if (!ui.limitsReadout) return;
      const ent = ir ? ir.entities.length : 0;
      const mlen = ui.matrixInput.value.length;
      const pgc = pinGroups.size;
      const pinc = pinnedEntityIds.size;
      ui.limitsReadout.textContent =
        `Limits: ${ROW_COUNT} rows | scene entities ${ent}/${MAX_ENTITIES} | matrix ${mlen} / ${MAX_TEXT_CHARS} chars | groups ${pgc}/${MAX_PIN_GROUP_COUNT} | pins ${pinc}`;
    }
    function buildSessionBundle() {
      return {
        v: 1,
        kind: "svg42_session_bundle",
        exportedAt: new Date().toISOString(),
        builderDsl: ui.builderDsl.value,
        matrixText: ui.matrixInput.value,
        phase2: ui.phase2Input.value,
        phase3: ui.phase3Input.value,
        seed: Number(ui.seed.value) || 42,
        entityCount: Number(ui.entityCount.value) || 120,
        profile: ui.profile.value,
        ir,
        pinGroups: Object.fromEntries(pinGroups),
        pinned: Array.from(pinnedEntityIds).sort((a, b) => a - b),
        abSwapPanes: !!(ui.abSwapPanes && ui.abSwapPanes.checked),
        abCompare
      };
    }
    function applySessionBundle(data) {
      if (!data || typeof data !== "object") throw new Error("Invalid bundle object.");
      if (data.v !== 1 || data.kind !== "svg42_session_bundle") {
        throw new Error("Not a v1 session bundle (expected kind: svg42_session_bundle).");
      }
      if (String(data.builderDsl != null ? data.builderDsl : "").length > MAX_TEXT_CHARS) throw new Error("Bundle DSL too large.");
      if (String(data.matrixText != null ? data.matrixText : "").length > MAX_TEXT_CHARS) throw new Error("Bundle matrix too large.");
      if (String(data.phase2 != null ? data.phase2 : "").length > MAX_TEXT_CHARS) throw new Error("Bundle phase2 too large.");
      if (String(data.phase3 != null ? data.phase3 : "").length > MAX_TEXT_CHARS) throw new Error("Bundle phase3 too large.");
      ui.builderDsl.value = data.builderDsl != null ? String(data.builderDsl) : DEFAULT_DSL;
      ui.matrixInput.value = data.matrixText != null ? String(data.matrixText) : "";
      ui.phase2Input.value = data.phase2 != null ? String(data.phase2) : "";
      ui.phase3Input.value = data.phase3 != null ? String(data.phase3) : "";
      if (data.seed != null) ui.seed.value = String(data.seed);
      if (data.entityCount != null) {
        ui.entityCount.value = String(clamp(Math.floor(Number(data.entityCount)) || 120, 1, MAX_ENTITIES));
      }
      if (data.profile && ["swarm", "mandala", "glitch"].includes(String(data.profile))) {
        ui.profile.value = data.profile;
      }
      if (data.ir) {
        validateIrShape(data.ir);
        ir = data.ir;
        schema = ir.schema;
        previewIr = null;
      } else {
        compileAndReport();
        if (!ir) throw new Error("Bundle had no IR and matrix failed to compile.");
      }
      abCompare = data.abCompare === true;
      const tbtn = document.getElementById("btnToggleAB");
      if (tbtn) tbtn.textContent = `A/B Compare: ${abCompare ? "On" : "Off"}`;
      if (data.abSwapPanes === true && ui.abSwapPanes) ui.abSwapPanes.checked = true;
      else if (data.abSwapPanes === false && ui.abSwapPanes) ui.abSwapPanes.checked = false;
      if (data.pinGroups != null && typeof data.pinGroups === "object" && !Array.isArray(data.pinGroups)) {
        const m = mergePinGroupsFromObject({ v: 1, groups: data.pinGroups }, true);
        if (!m.ok) throw new Error(m.msg);
      }
      if (Array.isArray(data.pinned)) {
        pinnedEntityIds.clear();
        for (const x of data.pinned) {
          const n = Math.floor(Number(x));
          if (Number.isFinite(n) && n >= 0 && n < MAX_ENTITIES) pinnedEntityIds.add(n);
        }
      }
      prunePinnedToIr();
      updatePlotChannelOptions();
      updatePinGroupUi();
      persistPinGroups(true);
      persistPinned(true);
      ui.phase3Trace.textContent = Array.isArray(ir?.meta?.phase3Trace) ? ir.meta.phase3Trace.join("\n") : "";
      const cp0 = ir?.meta?.phase3Checkpoints;
      if (cp0 && cp0.length >= 2) {
        ui.phase3Diff.textContent = "[diff last pass]\n" + diffIrBrief(cp0[cp0.length - 2].ir, cp0[cp0.length - 1].ir);
      } else {
        ui.phase3Diff.textContent = "";
      }
      updateCheckpointUi();
      updateLimitsReadout();
      renderCurrent();
      ui.compileStatus.innerHTML = "<span class=\"ok\">Session bundle applied.</span>";
    }
    function focusEntityId(rawId, withFlash) {
      if (!ir) {
        pinGroupsSetStatus("compile IR first", false);
        return false;
      }
      const nE = ir.entities.length;
      if (nE < 1) return false;
      const n = ((Math.floor(Number(rawId)) % nE) + nE) % nE;
      selectedEntityId = n;
      ui.entityJumpId.value = String(n);
      if (withFlash) {
        transientJumpId = n;
        if (jumpFlashTimer) clearTimeout(jumpFlashTimer);
        jumpFlashTimer = setTimeout(() => {
          transientJumpId = null;
          jumpFlashTimer = null;
          renderCurrent();
        }, 1200);
      }
      updateEntityInspector();
      renderCurrent();
      requestAnimationFrame(() => {
        const el = ui.stage.querySelector(`[data-eid="${n}"]`);
        if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      });
      return true;
    }
    function bumpEntity(delta) {
      if (!ir || !ir.entities.length) return;
      const nE = ir.entities.length;
      const cur = Number.isFinite(selectedEntityId) ? Math.floor(selectedEntityId) : 0;
      const id = ((cur + delta) % nE + nE) % nE;
      focusEntityId(id, true);
    }
    function pickRandomEntity() {
      if (!ir || !ir.entities.length) return;
      const rand = mulberry32((Date.now() ^ 0x9e3779b9 | 0) >>> 0);
      const id = Math.floor(rand() * ir.entities.length);
      focusEntityId(id, true);
    }
    function doEntityJump() {
      if (!ir) {
        pinGroupsSetStatus("compile IR first", false);
        return;
      }
      const n = Math.floor(Number(ui.entityJumpId.value));
      if (!Number.isFinite(n) || n < 0 || n >= ir.entities.length) {
        pinGroupsSetStatus(`entity id: 0..${ir.entities.length - 1}`, false);
        return;
      }
      focusEntityId(n, true);
    }
    function scheduleSessionDraftSave() {
      if (draftSaveTimer) clearTimeout(draftSaveTimer);
      draftSaveTimer = setTimeout(flushSessionDraft, DRAFT_DEBOUNCE_MS);
    }
    function flushSessionDraft() {
      draftSaveTimer = null;
      const payload = {
        v: 1,
        at: new Date().toISOString(),
        builderDsl: ui.builderDsl.value,
        matrixText: ui.matrixInput.value,
        phase2: ui.phase2Input.value,
        phase3: ui.phase3Input.value,
        seed: Number(ui.seed.value) || 42,
        entityCount: Number(ui.entityCount.value) || 120,
        profile: ui.profile.value,
        deltaHeatOnB: boolInput(ui.deltaHeatOnB),
        autoPreviewScrub: boolInput(ui.autoPreviewScrub),
        abSwapPanes: boolInput(ui.abSwapPanes)
      };
      safeLocalJsonSet(LS_DRAFT_KEY, payload, DRAFT_MAX_BYTES);
    }
    function readSessionDraft() {
      return safeLocalJsonGet(LS_DRAFT_KEY, null);
    }
    function clearSessionDraft() {
      safeLocalRemove(LS_DRAFT_KEY);
    }
    function buildSharePayload() {
      return {
        v: 1,
        builderDsl: ui.builderDsl.value || "",
        matrixText: ui.matrixInput.value || "",
        phase2: ui.phase2Input.value || "",
        phase3: ui.phase3Input.value || "",
        seed: Number(ui.seed.value) || 42,
        entityCount: Number(ui.entityCount.value) || 120,
        profile: ui.profile.value || "swarm",
        deltaHeatOnB: !!(ui.deltaHeatOnB && ui.deltaHeatOnB.checked),
        abSwapPanes: !!(ui.abSwapPanes && ui.abSwapPanes.checked),
        page: (typeof activePage === "string" && activePage) ? activePage : "build",
        theme: document.body.getAttribute("data-theme") || "default"
      };
    }
    const SHARE_HASH_MAX_BYTES = 200 * 1024;
    function encodeShareHash(payload) {
      try {
        const json = JSON.stringify(payload);
        if (json.length > SHARE_HASH_MAX_BYTES) return "";
        const bytes = new TextEncoder().encode(json);
        let bin = "";
        for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
        const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
        return "#s=" + b64;
      } catch (_e) {
        return "";
      }
    }
    function decodeShareHash(hash) {
      try {
        if (!hash) return null;
        const m = String(hash).match(/[#&]s=([A-Za-z0-9_\-]+)/);
        if (!m) return null;
        let b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
        while (b64.length % 4) b64 += "=";
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
        const json = new TextDecoder().decode(bytes);
        const data = JSON.parse(json);
        if (!data || data.v !== 1) return null;
        return data;
      } catch (_e) { return null; }
    }
    function applySharePayload(d) {
      if (!d) return false;
      if (d.builderDsl != null) ui.builderDsl.value = String(d.builderDsl).slice(0, MAX_TEXT_CHARS);
      if (d.matrixText != null) ui.matrixInput.value = String(d.matrixText).slice(0, MAX_TEXT_CHARS);
      if (d.phase2 != null) ui.phase2Input.value = String(d.phase2).slice(0, MAX_TEXT_CHARS);
      if (d.phase3 != null) ui.phase3Input.value = String(d.phase3).slice(0, MAX_TEXT_CHARS);
      if (d.seed != null) ui.seed.value = String(Number(d.seed) || 42);
      if (d.entityCount != null) ui.entityCount.value = String(clamp(Math.floor(Number(d.entityCount)) || 120, 1, MAX_ENTITIES));
      if (d.profile && ["swarm", "mandala", "glitch"].includes(d.profile)) ui.profile.value = d.profile;
      if (ui.deltaHeatOnB) ui.deltaHeatOnB.checked = !!d.deltaHeatOnB;
      if (ui.abSwapPanes) ui.abSwapPanes.checked = !!d.abSwapPanes;
      if (typeof d.theme === "string" && ["default", "midnight", "lab", "synthwave"].includes(d.theme)) {
        try { applyTheme(d.theme); } catch (_e) { /* keep current */ }
      }
      if (typeof d.page === "string" && Array.isArray(PAGE_LIST) && PAGE_LIST.includes(d.page)) {
        try { setActivePage(d.page, true); } catch (_e) { /* keep current */ }
      }
      return true;
    }
    function shareCurrentLink() {
      const payload = buildSharePayload();
      const hash = encodeShareHash(payload);
      if (!hash) {
        showToast("Encode failed (payload too large or non-serializable).", "error");
        return;
      }
      if (hash.length > 8000) {
        showToast(`Hash is ${hash.length} chars; URL may be truncated by some chat clients.`, "warn");
      }
      const url = window.location.origin + window.location.pathname + window.location.search + hash;
      lastUrlHashSig = hash;
      try { history.replaceState(null, "", hash); } catch (_e) { /* ignore */ }
      navigator.clipboard.writeText(url).then(
        () => showToast(`Share link copied (${url.length} chars).`, "ok"),
        () => showToast("Clipboard write failed; URL is in the address bar.", "warn")
      );
    }
    function parseSimpleHashParams(hash) {
      const out = {};
      if (!hash) return out;
      const body = String(hash).replace(/^#/, "");
      if (!body) return out;
      body.split("&").forEach((pair) => {
        const eq = pair.indexOf("=");
        if (eq < 0) return;
        const k = decodeURIComponent(pair.slice(0, eq));
        const v = decodeURIComponent(pair.slice(eq + 1));
        if (k && k !== "s") out[k] = v;
      });
      return out;
    }
    function tryApplyHashFromUrl() {
      const hash = window.location.hash || "";
      if (!hash || hash === lastUrlHashSig) return false;
      lastUrlHashSig = hash;
      // Bare shortcut: #page=lab  or  #page=inspect&theme=midnight
      // (no s= payload). Apply quietly without re-compiling.
      if (!/[#&]s=/.test(hash)) {
        const params = parseSimpleHashParams(hash);
        let touched = false;
        if (params.theme && ["default", "midnight", "lab", "synthwave"].includes(params.theme)) {
          try { applyTheme(params.theme); touched = true; } catch (_e) { /* noop */ }
        }
        if (params.page && Array.isArray(PAGE_LIST) && PAGE_LIST.includes(params.page)) {
          try { setActivePage(params.page, true); touched = true; } catch (_e) { /* noop */ }
        }
        if (touched) showToast("Applied URL preferences.", "ok");
        return touched;
      }
      const data = decodeShareHash(hash);
      if (!data) { showToast("URL hash payload invalid.", "warn"); return false; }
      applySharePayload(data);
      try {
        schema = parseDsl(ui.builderDsl.value);
      } catch (_e) { /* keep prior */ }
      compileAndReport();
      showToast("Loaded session from URL hash.", "ok");
      return true;
    }
    function setStageHud(visible, persist = true) {
      stageHudShown = !!visible;
      if (ui.stageHud) {
        if (stageHudShown) ui.stageHud.classList.add("show");
        else ui.stageHud.classList.remove("show");
      }
      if (persist) safeLocalSet(LS_HUD_KEY, stageHudShown ? "1" : "0");
    }
    function loadAnnotations() {
      const data = safeLocalJsonGet(LS_ANNOTATIONS_KEY, null);
      if (!data || typeof data !== "object") return;
      for (const [k, v] of Object.entries(data)) {
        const id = Number(k);
        if (Number.isFinite(id) && typeof v === "string" && v.length <= 200) {
          entityAnnotations.set(id, v);
        }
      }
    }
    function persistAnnotations() {
      const obj = {};
      for (const [k, v] of entityAnnotations) obj[k] = v;
      return safeLocalJsonSet(LS_ANNOTATIONS_KEY, obj, 64 * 1024);
    }
    function refreshEntityAnnotationUi() {
      if (!ui.entityAnnotation || !ui.entityAnnotationInput) return;
      if (!Number.isFinite(selectedEntityId)) {
        ui.entityAnnotation.style.display = "none";
        return;
      }
      ui.entityAnnotation.style.display = "block";
      const note = entityAnnotations.get(selectedEntityId) || "";
      if (ui.entityAnnotationInput.value !== note) ui.entityAnnotationInput.value = note;
      if (ui.entityAnnotationStatus) {
        const total = entityAnnotations.size;
        ui.entityAnnotationStatus.textContent = `Entity ${selectedEntityId} · ${total} annotation${total === 1 ? "" : "s"} saved.`;
      }
    }
    function setEntityAnnotation(id, note) {
      if (!Number.isFinite(id)) return;
      const trimmed = String(note || "").slice(0, 200);
      if (!trimmed) entityAnnotations.delete(id);
      else entityAnnotations.set(id, trimmed);
      persistAnnotations();
      refreshEntityAnnotationUi();
    }
    function loadStageHud() {
      if (safeLocalGet(LS_HUD_KEY) === "1") setStageHud(true, false);
    }
    function refreshStageHud() {
      if (!ui.stageHud || !stageHudShown) return;
      const activeIr = previewIr || ir;
      const count = activeIr ? activeIr.entities.length : 0;
      const parts = [
        `entities: ${count}`,
        `t: ${stageTime.toFixed(2)}`,
        `render: ${lastRenderMs.toFixed(1)} ms`,
        `fps: ${smoothedFps.toFixed(1)}`,
        `zoom: ${stageZoom.toFixed(2)}x`
      ];
      if (atlasFilters.size) {
        const ids = atlasMatchingIds(activeIr);
        parts.push(`flt: ${ids.length}/${count}`);
      }
      ui.stageHud.textContent = parts.join("  ·  ");
    }

    // ----- Scatter plot ---------------------------------------------------
    function refreshScatterChannelOptions() {
      const activeIr = previewIr || ir;
      if (!activeIr) return;
      const list = activeIr.schema.map((s) => s.name);
      const fillSel = (el, includeBlank) => {
        if (!el) return;
        const cur = el.value;
        const opts = [];
        if (includeBlank) opts.push('<option value="">(constant)</option>');
        for (const n of list) opts.push(`<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`);
        el.innerHTML = opts.join("");
        if (cur && (includeBlank ? (cur === "" || list.includes(cur)) : list.includes(cur))) el.value = cur;
      };
      fillSel(ui.scatterX, false);
      fillSel(ui.scatterY, false);
      fillSel(ui.scatterColor, true);
      fillSel(ui.scatterSize, true);
      if (ui.scatterX && !ui.scatterX.value && list.length) ui.scatterX.value = list[0];
      if (ui.scatterY && !ui.scatterY.value && list.length > 1) ui.scatterY.value = list[1];
    }
    function logSafe(v) { return v > 0 ? Math.log10(v) : 0; }
    function scatterScale(values, useLog) {
      let lo = Infinity, hi = -Infinity;
      const out = values.slice();
      if (useLog) {
        for (let i = 0; i < out.length; i += 1) out[i] = logSafe(Math.max(1e-6, out[i]));
      }
      for (const v of out) { if (v < lo) lo = v; if (v > hi) hi = v; }
      if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo === hi) {
        return { min: lo || 0, max: (hi || 0) + 1, values: out };
      }
      return { min: lo, max: hi, values: out };
    }
    function refreshScatter() {
      if (!ui.scatterCanvas) return;
      // any DOM-resident dashed rect from an in-flight brush is wiped by innerHTML below;
      // explicitly null it out here too so a stray pointer doesn't survive
      const staleBand = ui.scatterCanvas.querySelector(".sc-rect");
      if (staleBand) staleBand.remove();
      const activeIr = previewIr || ir;
      if (!activeIr || !activeIr.entities.length) {
        ui.scatterCanvas.innerHTML = '<div class="small" style="padding:10px;color:var(--muted)">Compile IR first.</div>';
        if (ui.scatterStatus) ui.scatterStatus.textContent = "no data";
        if (ui.scatterStats) ui.scatterStats.textContent = "";
        scatterPointMap = [];
        return;
      }
      const xCh = ui.scatterX ? ui.scatterX.value : "";
      const yCh = ui.scatterY ? ui.scatterY.value : "";
      const cCh = ui.scatterColor ? ui.scatterColor.value : "";
      const sCh = ui.scatterSize ? ui.scatterSize.value : "";
      if (!xCh || !yCh) {
        ui.scatterCanvas.innerHTML = '<div class="small" style="padding:10px;color:var(--muted)">Pick X and Y channels.</div>';
        return;
      }
      const xVals = activeIr.entities.map((e) => ensureFinite(e[xCh]));
      const yVals = activeIr.entities.map((e) => ensureFinite(e[yCh]));
      const xS = scatterScale(xVals, !!(ui.scatterLogX && ui.scatterLogX.checked));
      const yS = scatterScale(yVals, !!(ui.scatterLogY && ui.scatterLogY.checked));
      const cVals = cCh ? activeIr.entities.map((e) => ensureFinite(e[cCh])) : null;
      const sVals = sCh ? activeIr.entities.map((e) => ensureFinite(e[sCh])) : null;
      let cMin = Infinity, cMax = -Infinity;
      if (cVals) for (const v of cVals) { if (v < cMin) cMin = v; if (v > cMax) cMax = v; }
      let sMin = Infinity, sMax = -Infinity;
      if (sVals) for (const v of sVals) { if (v < sMin) sMin = v; if (v > sMax) sMax = v; }
      const w = SCATTER_W;
      const h = SCATTER_H;
      const pad = SCATTER_PAD;
      const inner = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 };
      const xRange = (xS.max - xS.min) || 1;
      const yRange = (yS.max - yS.min) || 1;
      const pts = [];
      const dots = [];
      for (let i = 0; i < activeIr.entities.length; i += 1) {
        const e = activeIr.entities[i];
        const xv = xS.values[i];
        const yv = yS.values[i];
        const px = inner.x + ((xv - xS.min) / xRange) * inner.w;
        const py = inner.y + inner.h - ((yv - yS.min) / yRange) * inner.h;
        let color = "hsla(190 80% 70% / 0.85)";
        if (cVals && cMax !== cMin) {
          const t = (cVals[i] - cMin) / (cMax - cMin);
          color = `hsl(${(220 - t * 200).toFixed(0)} 80% ${(40 + t * 30).toFixed(0)}%)`;
        }
        let r = 2.4;
        if (sVals && sMax !== sMin) {
          const t = (sVals[i] - sMin) / (sMax - sMin);
          r = 1.4 + t * 4.6;
        }
        const isSel = scatterSelection.has(e.id);
        const isPin = pinnedEntityIds.has(e.id);
        let stroke = "none";
        let sw = 0;
        if (isSel) { stroke = "hsla(190 100% 80% / 0.95)"; sw = 1.4; }
        else if (isPin) { stroke = "hsla(55 100% 70% / 0.85)"; sw = 1.2; }
        dots.push(`<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${r.toFixed(2)}" fill="${color}" stroke="${stroke}" stroke-width="${sw}" data-eid="${e.id}"/>`);
        pts.push({ id: e.id, px, py, x: xVals[i], y: yVals[i] });
      }
      scatterPointMap = pts;
      let trendSvg = "";
      if (ui.scatterTrend && ui.scatterTrend.checked && pts.length > 1) {
        let mx = 0, my = 0, vxx = 0, vxy = 0;
        for (let i = 0; i < xVals.length; i += 1) { mx += xVals[i]; my += yVals[i]; }
        mx /= xVals.length; my /= yVals.length;
        for (let i = 0; i < xVals.length; i += 1) {
          const dx = xVals[i] - mx, dy = yVals[i] - my;
          vxx += dx * dx; vxy += dx * dy;
        }
        if (vxx > 1e-9) {
          const slope = vxy / vxx;
          const intercept = my - slope * mx;
          const yAt = (rawX) => intercept + slope * rawX;
          const xL = xS.values[0] * 0 + (ui.scatterLogX && ui.scatterLogX.checked ? logSafe(Math.max(1e-6, Math.min(...xVals))) : Math.min(...xVals));
          const xR = ui.scatterLogX && ui.scatterLogX.checked ? logSafe(Math.max(1e-6, Math.max(...xVals))) : Math.max(...xVals);
          const px1 = inner.x + ((xL - xS.min) / xRange) * inner.w;
          const px2 = inner.x + ((xR - xS.min) / xRange) * inner.w;
          const yLraw = yAt(ui.scatterLogX && ui.scatterLogX.checked ? Math.pow(10, xL) : xL);
          const yRraw = yAt(ui.scatterLogX && ui.scatterLogX.checked ? Math.pow(10, xR) : xR);
          const yL = ui.scatterLogY && ui.scatterLogY.checked ? logSafe(Math.max(1e-6, yLraw)) : yLraw;
          const yR = ui.scatterLogY && ui.scatterLogY.checked ? logSafe(Math.max(1e-6, yRraw)) : yRraw;
          const py1 = inner.y + inner.h - ((yL - yS.min) / yRange) * inner.h;
          const py2 = inner.y + inner.h - ((yR - yS.min) / yRange) * inner.h;
          trendSvg = `<line x1="${px1.toFixed(2)}" y1="${py1.toFixed(2)}" x2="${px2.toFixed(2)}" y2="${py2.toFixed(2)}" stroke="hsla(50 100% 70% / 0.9)" stroke-width="1.6" stroke-dasharray="4 3"/>`;
          if (ui.scatterStats) {
            const r = pearson(xVals, yVals);
            ui.scatterStats.textContent = `n=${pts.length}  slope=${slope.toFixed(4)}  intercept=${intercept.toFixed(3)}  r=${r.toFixed(3)}`;
          }
        }
      } else if (ui.scatterStats) {
        ui.scatterStats.textContent = `n=${pts.length}  X∈[${Math.min(...xVals).toFixed(2)},${Math.max(...xVals).toFixed(2)}]  Y∈[${Math.min(...yVals).toFixed(2)},${Math.max(...yVals).toFixed(2)}]`;
      }
      const axisColor = "rgba(140,162,199,0.55)";
      const grid = [];
      for (let i = 0; i <= 4; i += 1) {
        const gx = inner.x + (inner.w * i) / 4;
        const gy = inner.y + (inner.h * i) / 4;
        grid.push(`<line x1="${gx}" y1="${inner.y}" x2="${gx}" y2="${inner.y + inner.h}" stroke="${axisColor}" stroke-width="0.4"/>`);
        grid.push(`<line x1="${inner.x}" y1="${gy}" x2="${inner.x + inner.w}" y2="${gy}" stroke="${axisColor}" stroke-width="0.4"/>`);
      }
      const labels = [
        `<text x="${(inner.x + inner.w / 2).toFixed(2)}" y="${(inner.y + inner.h + 18).toFixed(2)}" fill="${axisColor}" font-size="10" text-anchor="middle">${escapeHtml(xCh)}${ui.scatterLogX && ui.scatterLogX.checked ? " (log)" : ""}</text>`,
        `<text x="${(inner.x - 8).toFixed(2)}" y="${(inner.y + inner.h / 2).toFixed(2)}" fill="${axisColor}" font-size="10" text-anchor="end" transform="rotate(-90 ${(inner.x - 8).toFixed(2)} ${(inner.y + inner.h / 2).toFixed(2)})">${escapeHtml(yCh)}${ui.scatterLogY && ui.scatterLogY.checked ? " (log)" : ""}</text>`
      ];
      const svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display:block;width:100%;height:${h}px">${grid.join("")}${trendSvg}${dots.join("")}${labels.join("")}</svg>`;
      ui.scatterCanvas.innerHTML = svg;
      if (ui.scatterStatus) ui.scatterStatus.textContent = `selected ${scatterSelection.size}`;
    }
    function bindScatterInteractions() {
      if (!ui.scatterCanvas) return;
      ui.scatterCanvas.addEventListener("mousedown", (ev) => {
        if (ev.button !== 0) return;
        const rect = ui.scatterCanvas.getBoundingClientRect();
        scatterBrushing = {
          rect,
          startX: ev.clientX - rect.left,
          startY: ev.clientY - rect.top,
          additive: ev.shiftKey,
          subtract: ev.altKey
        };
        ev.preventDefault();
      });
      ui.scatterCanvas.addEventListener("click", (ev) => {
        if (ev.target && ev.target.tagName === "circle") {
          const eid = Number(ev.target.getAttribute("data-eid"));
          if (Number.isFinite(eid)) {
            selectedEntityId = eid;
            updateEntityInspector();
          }
        }
      });
      window.addEventListener("mousemove", (ev) => {
        if (!scatterBrushing) return;
        const rect = scatterBrushing.rect;
        const x = clamp(ev.clientX - rect.left, 0, rect.width);
        const y = clamp(ev.clientY - rect.top, 0, rect.height);
        let band = ui.scatterCanvas.querySelector(".sc-rect");
        if (!band) {
          band = document.createElement("div");
          band.className = "sc-rect";
          band.style.cssText = "position:absolute;border:1px dashed hsla(190 100% 70% / 0.85);background:hsla(190 100% 60% / 0.10);pointer-events:none";
          ui.scatterCanvas.appendChild(band);
        }
        const lx = Math.min(scatterBrushing.startX, x);
        const ly = Math.min(scatterBrushing.startY, y);
        band.style.left = lx + "px";
        band.style.top = ly + "px";
        band.style.width = Math.abs(scatterBrushing.startX - x) + "px";
        band.style.height = Math.abs(scatterBrushing.startY - y) + "px";
      });
      window.addEventListener("mouseup", (ev) => {
        if (!scatterBrushing) return;
        const rect = scatterBrushing.rect;
        const x = clamp(ev.clientX - rect.left, 0, rect.width);
        const y = clamp(ev.clientY - rect.top, 0, rect.height);
        const dx = Math.abs(scatterBrushing.startX - x);
        const dy = Math.abs(scatterBrushing.startY - y);
        const wRatio = rect.width / SCATTER_W;
        const hRatio = rect.height / SCATTER_H;
        const sxScale = (px) => px / wRatio;
        const syScale = (py) => py / hRatio;
        const lx = sxScale(Math.min(scatterBrushing.startX, x));
        const ly = syScale(Math.min(scatterBrushing.startY, y));
        const rx = sxScale(Math.max(scatterBrushing.startX, x));
        const ry = syScale(Math.max(scatterBrushing.startY, y));
        const additive = scatterBrushing.additive;
        const subtract = scatterBrushing.subtract;
        scatterBrushing = null;
        const band = ui.scatterCanvas.querySelector(".sc-rect");
        if (band) band.remove();
        if (dx < 3 && dy < 3) { refreshScatter(); return; }
        if (!additive && !subtract) scatterSelection.clear();
        for (const p of scatterPointMap) {
          if (p.px >= lx && p.px <= rx && p.py >= ly && p.py <= ry) {
            if (subtract) scatterSelection.delete(p.id);
            else scatterSelection.add(p.id);
          }
        }
        refreshScatter();
        showToast(`Scatter selection: ${scatterSelection.size}`, "ok");
      });
    }
    function pinScatterSelection() {
      if (!scatterSelection.size) { showToast("No scatter selection.", "warn"); return; }
      let added = 0;
      for (const id of scatterSelection) {
        if (pinnedEntityIds.size >= MAX_PIN_IDS_PER_GROUP * 4) break;
        if (!pinnedEntityIds.has(id)) { pinnedEntityIds.add(id); added += 1; }
      }
      persistPinned(true);
      updatePinnedInspector();
      updateLimitsReadout();
      renderCurrent();
      showToast(`Pinned ${added} from scatter.`, "ok");
    }
    function clearScatterSelection() {
      if (!scatterSelection.size) return;
      scatterSelection.clear();
      refreshScatter();
    }

    // ----- Color palette editor ------------------------------------------
    function generatePaletteHues(stops, baseHue, sat, light) {
      const out = [];
      const n = clamp(Math.floor(stops), 2, PALETTE_MAX);
      for (let i = 0; i < n; i += 1) {
        const hue = (baseHue + (i * 360) / n) % 360;
        out.push({ h: hue, s: sat, l: light });
      }
      return out;
    }
    function paletteToCss(p) { return `hsl(${p.h.toFixed(0)} ${p.s.toFixed(0)}% ${p.l.toFixed(0)}%)`; }
    function getCurrentPaletteSpec() {
      return {
        stops: numInput(ui.paletteStops, 2, PALETTE_MAX, 6),
        base: numInput(ui.paletteBase, 0, 359, 0),
        sat: numInput(ui.paletteSat, 0, 100, 70),
        light: numInput(ui.paletteLight, 0, 100, 60)
      };
    }
    function refreshPaletteSwatches() {
      if (!ui.paletteSwatches) return;
      const spec = getCurrentPaletteSpec();
      const stops = generatePaletteHues(spec.stops, spec.base, spec.sat, spec.light);
      const html = stops.map((p, i) =>
        `<span title="hue=${p.h.toFixed(1)}" style="display:inline-flex;align-items:center;gap:4px;padding:3px 6px;border-radius:6px;border:1px solid var(--line);background:var(--panel-2);font-size:0.72rem"><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${paletteToCss(p)}"></span>${i}</span>`
      ).join("");
      ui.paletteSwatches.innerHTML = html;
    }
    function refreshPaletteSelect() {
      if (!ui.paletteSelect) return;
      const cur = ui.paletteSelect.value;
      ui.paletteSelect.innerHTML = "";
      if (!palettes.size) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "(no palettes)";
        ui.paletteSelect.appendChild(opt);
      } else {
        for (const name of palettes.keys()) {
          const opt = document.createElement("option");
          opt.value = name;
          opt.textContent = name;
          ui.paletteSelect.appendChild(opt);
        }
        if (cur && palettes.has(cur)) ui.paletteSelect.value = cur;
        else ui.paletteSelect.value = palettes.keys().next().value;
      }
    }
    function persistPalettes() {
      const obj = {};
      for (const [k, v] of palettes) obj[k] = v;
      return safeLocalJsonSet(LS_PALETTES_KEY, obj, 256 * 1024);
    }
    function loadPalettes() {
      const obj = safeLocalJsonGet(LS_PALETTES_KEY, null);
      if (!obj || typeof obj !== "object") return;
      for (const [k, v] of Object.entries(obj)) {
        if (typeof k !== "string" || !v || typeof v !== "object") continue;
        if (!Array.isArray(v.stops)) continue;
        const stops = v.stops.filter((p) => p && Number.isFinite(p.h)).slice(0, PALETTE_MAX);
        if (!stops.length) continue;
        palettes.set(k.slice(0, 32), { stops });
      }
    }
    function savePalette() {
      const name = (ui.paletteName && ui.paletteName.value || "").trim().slice(0, 32);
      if (!name) { showToast("Palette name required.", "warn"); return; }
      const spec = getCurrentPaletteSpec();
      const stops = generatePaletteHues(spec.stops, spec.base, spec.sat, spec.light);
      palettes.set(name, { stops });
      activePaletteName = name;
      persistPalettes();
      refreshPaletteSelect();
      ui.paletteSelect.value = name;
      if (ui.paletteStatus) ui.paletteStatus.textContent = `saved "${name}" (${stops.length} stops).`;
      showToast(`Palette "${name}" saved.`, "ok");
    }
    function deletePalette() {
      const name = ui.paletteSelect ? ui.paletteSelect.value : "";
      if (!name || !palettes.has(name)) { showToast("Pick a palette to delete.", "warn"); return; }
      palettes.delete(name);
      if (activePaletteName === name) activePaletteName = null;
      persistPalettes();
      refreshPaletteSelect();
      if (ui.paletteStatus) ui.paletteStatus.textContent = `removed "${name}".`;
    }
    function applyPaletteToHue() {
      if (!ir) { showToast("Compile IR first.", "warn"); return; }
      const name = ui.paletteSelect ? ui.paletteSelect.value : "";
      const palette = name && palettes.has(name) ? palettes.get(name) : null;
      const stops = palette ? palette.stops : generatePaletteHues(getCurrentPaletteSpec().stops, getCurrentPaletteSpec().base, getCurrentPaletteSpec().sat, getCurrentPaletteSpec().light);
      if (!stops.length) { showToast("Empty palette.", "warn"); return; }
      const huesArr = stops.map((p) => p.h).sort((a, b) => a - b);
      let touched = 0;
      for (const e of ir.entities) {
        const v = ((Number(e.hue) % 360) + 360) % 360;
        let best = huesArr[0];
        let bestD = Math.min(Math.abs(v - best), 360 - Math.abs(v - best));
        for (let i = 1; i < huesArr.length; i += 1) {
          const cand = huesArr[i];
          const d = Math.min(Math.abs(v - cand), 360 - Math.abs(v - cand));
          if (d < bestD) { bestD = d; best = cand; }
        }
        if (Math.abs(e.hue - best) > 1e-6) { e.hue = best; touched += 1; }
      }
      previewIr = null;
      renderCurrent();
      if (ui.paletteStatus) ui.paletteStatus.textContent = `quantized ${touched} entity hues to "${name || "(unsaved)"}".`;
      showToast(`Palette applied to ${touched} entities.`, "ok");
    }
    function randomizePalette() {
      if (ui.paletteBase) ui.paletteBase.value = String(Math.floor(Math.random() * 360));
      if (ui.paletteSat) ui.paletteSat.value = String(40 + Math.floor(Math.random() * 50));
      if (ui.paletteLight) ui.paletteLight.value = String(35 + Math.floor(Math.random() * 35));
      refreshPaletteSwatches();
    }
    function rotatePaletteHue() {
      if (!ui.paletteBase) return;
      const v = (Number(ui.paletteBase.value) || 0) + 30;
      ui.paletteBase.value = String(v % 360);
      refreshPaletteSwatches();
    }

    // ----- Snapshot diff matrix ------------------------------------------
    function refreshDiffMatrixChannelOptions() {
      if (!ui.diffMatrixChannel) return;
      const activeIr = previewIr || ir;
      if (!activeIr) return;
      const cur = ui.diffMatrixChannel.value;
      ui.diffMatrixChannel.innerHTML = activeIr.schema.map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("");
      if (cur && activeIr.schema.some((s) => s.name === cur)) ui.diffMatrixChannel.value = cur;
    }
    function snapshotChannelArray(snapIr, channel) {
      if (!snapIr || !Array.isArray(snapIr.entities)) return [];
      const out = new Array(snapIr.entities.length);
      for (let i = 0; i < snapIr.entities.length; i += 1) out[i] = ensureFinite(snapIr.entities[i][channel]);
      return out;
    }
    function diffMatrixDistance(a, b, metric) {
      const n = Math.min(a.length, b.length);
      if (!n) return 0;
      let sum = 0, mx = 0, sq = 0;
      for (let i = 0; i < n; i += 1) {
        const d = Math.abs(a[i] - b[i]);
        sum += d;
        sq += d * d;
        if (d > mx) mx = d;
      }
      if (metric === "rms") return Math.sqrt(sq / n);
      if (metric === "max") return mx;
      return sum / n;
    }
    function refreshDiffMatrix() {
      if (!ui.diffMatrix) return;
      const list = Array.from(snapshots.entries());
      if (!list.length) {
        ui.diffMatrix.innerHTML = '<div class="small" style="color:var(--muted);padding:6px">No snapshots saved.</div>';
        if (ui.diffMatrixStatus) ui.diffMatrixStatus.textContent = "0 snapshots";
        return;
      }
      const ch = ui.diffMatrixChannel ? ui.diffMatrixChannel.value : "hue";
      const metric = ui.diffMatrixMetric ? ui.diffMatrixMetric.value : "meanAbs";
      const arrays = list.map(([_n, snap]) => snapshotChannelArray(snap.ir, ch));
      const n = list.length;
      const dist = Array.from({ length: n }, () => new Array(n).fill(0));
      let mx = 0;
      for (let i = 0; i < n; i += 1) {
        for (let j = i + 1; j < n; j += 1) {
          const d = diffMatrixDistance(arrays[i], arrays[j], metric);
          dist[i][j] = d;
          dist[j][i] = d;
          if (d > mx) mx = d;
        }
      }
      const cell = 32;
      const pad = 80;
      const w = pad + n * cell + 12;
      const h = pad + n * cell + 12;
      const cells = [];
      const labelsX = [];
      const labelsY = [];
      for (let i = 0; i < n; i += 1) {
        labelsY.push(`<text x="${pad - 6}" y="${(pad + i * cell + cell * 0.65).toFixed(2)}" fill="var(--muted)" font-size="10" text-anchor="end">${escapeHtml(list[i][0]).slice(0, 12)}</text>`);
        labelsX.push(`<text x="${(pad + i * cell + cell / 2).toFixed(2)}" y="${(pad - 6).toFixed(2)}" fill="var(--muted)" font-size="10" text-anchor="end" transform="rotate(-45 ${(pad + i * cell + cell / 2).toFixed(2)} ${(pad - 6).toFixed(2)})">${escapeHtml(list[i][0]).slice(0, 12)}</text>`);
        for (let j = 0; j < n; j += 1) {
          const v = dist[i][j];
          const t = mx > 0 ? v / mx : 0;
          const fill = i === j ? "rgba(140,162,199,0.20)" : `hsl(${(220 - t * 200).toFixed(0)} 70% ${(30 + t * 25).toFixed(0)}%)`;
          cells.push(`<rect x="${(pad + j * cell).toFixed(2)}" y="${(pad + i * cell).toFixed(2)}" width="${cell - 1}" height="${cell - 1}" fill="${fill}" data-i="${i}" data-j="${j}" style="cursor:pointer"><title>${escapeHtml(list[i][0])} vs ${escapeHtml(list[j][0])}: ${v.toFixed(3)}</title></rect>`);
        }
      }
      ui.diffMatrix.innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="display:block;width:${w}px;height:${h}px">${cells.join("")}${labelsX.join("")}${labelsY.join("")}</svg>`;
      const svgEl = ui.diffMatrix.querySelector("svg");
      if (svgEl) {
        svgEl.addEventListener("click", (ev) => {
          const tg = ev.target;
          if (!tg || tg.tagName !== "rect") return;
          const i = Number(tg.getAttribute("data-i"));
          const j = Number(tg.getAttribute("data-j"));
          if (!Number.isFinite(i) || !Number.isFinite(j) || i === j) return;
          const a = list[i];
          const b = list[j];
          if (!a || !b) return;
          previewIr = snapshotIr(a[1].ir);
          ir = snapshotIr(b[1].ir);
          renderCurrent();
          showToast(`Loaded "${a[0]}" → preview, "${b[0]}" → current.`, "ok");
        });
      }
      if (ui.diffMatrixStatus) ui.diffMatrixStatus.textContent = `${n}× snapshots, ch=${ch}, max ${metric}=${mx.toFixed(3)}`;
    }

    // ----- Transfer function editor --------------------------------------
    function refreshTransferChannels() {
      if (!ui.transferChannel) return;
      const activeIr = previewIr || ir;
      if (!activeIr) return;
      const cur = ui.transferChannel.value;
      ui.transferChannel.innerHTML = activeIr.schema.map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("");
      if (cur && activeIr.schema.some((s) => s.name === cur)) ui.transferChannel.value = cur;
    }
    function evalTransferAt(x) {
      if (!transferPoints.length) return x;
      if (x <= transferPoints[0].x) return transferPoints[0].y;
      if (x >= transferPoints[transferPoints.length - 1].x) return transferPoints[transferPoints.length - 1].y;
      for (let i = 1; i < transferPoints.length; i += 1) {
        const a = transferPoints[i - 1];
        const b = transferPoints[i];
        if (x >= a.x && x <= b.x) {
          const t = (b.x - a.x) > 1e-9 ? (x - a.x) / (b.x - a.x) : 0;
          return a.y + (b.y - a.y) * t;
        }
      }
      return x;
    }
    function refreshTransferCanvas() {
      if (!ui.transferCanvas) return;
      const w = TRANSFER_W;
      const h = TRANSFER_H;
      const pad = TRANSFER_PAD;
      const inner = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 };
      const grid = [];
      for (let i = 0; i <= 4; i += 1) {
        const gx = inner.x + (inner.w * i) / 4;
        const gy = inner.y + (inner.h * i) / 4;
        grid.push(`<line x1="${gx}" y1="${inner.y}" x2="${gx}" y2="${inner.y + inner.h}" stroke="rgba(140,162,199,0.3)" stroke-width="0.5"/>`);
        grid.push(`<line x1="${inner.x}" y1="${gy}" x2="${inner.x + inner.w}" y2="${gy}" stroke="rgba(140,162,199,0.3)" stroke-width="0.5"/>`);
      }
      const samples = 64;
      let pathD = "";
      for (let i = 0; i <= samples; i += 1) {
        const xx = i / samples;
        const yy = clamp(evalTransferAt(xx), 0, 1);
        const sx = inner.x + xx * inner.w;
        const sy = inner.y + (1 - yy) * inner.h;
        pathD += (i === 0 ? "M " : "L ") + sx.toFixed(2) + " " + sy.toFixed(2) + " ";
      }
      const dots = transferPoints.map((p, i) => {
        const sx = inner.x + p.x * inner.w;
        const sy = inner.y + (1 - p.y) * inner.h;
        return `<circle cx="${sx.toFixed(2)}" cy="${sy.toFixed(2)}" r="4" fill="hsla(50 100% 70% / 0.95)" stroke="rgba(0,0,0,0.5)" stroke-width="0.6" data-tfi="${i}" style="cursor:grab"/>`;
      }).join("");
      const ident = `<line x1="${inner.x}" y1="${inner.y + inner.h}" x2="${inner.x + inner.w}" y2="${inner.y}" stroke="rgba(140,162,199,0.4)" stroke-width="0.6" stroke-dasharray="3 3"/>`;
      ui.transferCanvas.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display:block;width:100%;height:${h}px">${grid.join("")}${ident}<path d="${pathD}" fill="none" stroke="hsla(190 100% 70% / 0.95)" stroke-width="1.6"/>${dots}</svg>`;
      if (ui.transferStats) ui.transferStats.textContent = `${transferPoints.length} points`;
    }
    function bindTransferInteractions() {
      if (!ui.transferCanvas) return;
      ui.transferCanvas.addEventListener("mousedown", (ev) => {
        const rect = ui.transferCanvas.getBoundingClientRect();
        const px = (ev.clientX - rect.left) * (TRANSFER_W / rect.width);
        const py = (ev.clientY - rect.top) * (TRANSFER_H / rect.height);
        if (ev.target && ev.target.hasAttribute && ev.target.hasAttribute("data-tfi")) {
          transferDragIdx = Number(ev.target.getAttribute("data-tfi"));
          if (ev.button === 2 || ev.altKey) {
            if (transferPoints.length > 2 && transferDragIdx > 0 && transferDragIdx < transferPoints.length - 1) {
              transferPoints.splice(transferDragIdx, 1);
              transferDragIdx = -1;
              refreshTransferCanvas();
              persistTransfer();
            }
            ev.preventDefault();
            return;
          }
          ev.preventDefault();
          return;
        }
        if (transferPoints.length >= TRANSFER_MAX_POINTS) return;
        const inner = { x: TRANSFER_PAD, y: TRANSFER_PAD, w: TRANSFER_W - TRANSFER_PAD * 2, h: TRANSFER_H - TRANSFER_PAD * 2 };
        const xN = clamp((px - inner.x) / inner.w, 0, 1);
        const yN = clamp(1 - (py - inner.y) / inner.h, 0, 1);
        const tooClose = transferPoints.some((p) => Math.abs(p.x - xN) < 1e-3);
        if (tooClose) return;
        transferPoints.push({ x: xN, y: yN });
        transferPoints.sort((a, b) => a.x - b.x);
        refreshTransferCanvas();
        persistTransfer();
      });
      window.addEventListener("mousemove", (ev) => {
        if (transferDragIdx < 0) return;
        const rect = ui.transferCanvas.getBoundingClientRect();
        const px = (ev.clientX - rect.left) * (TRANSFER_W / rect.width);
        const py = (ev.clientY - rect.top) * (TRANSFER_H / rect.height);
        const inner = { x: TRANSFER_PAD, y: TRANSFER_PAD, w: TRANSFER_W - TRANSFER_PAD * 2, h: TRANSFER_H - TRANSFER_PAD * 2 };
        const xN = clamp((px - inner.x) / inner.w, 0, 1);
        const yN = clamp(1 - (py - inner.y) / inner.h, 0, 1);
        const last = transferPoints.length - 1;
        const i = transferDragIdx;
        if (i === 0) transferPoints[0].x = 0;
        else if (i === last) transferPoints[last].x = 1;
        else transferPoints[i].x = clamp(xN, transferPoints[i - 1].x + 0.001, transferPoints[i + 1].x - 0.001);
        transferPoints[i].y = Math.round(yN * 20) / 20;
        refreshTransferCanvas();
      });
      window.addEventListener("mouseup", () => {
        if (transferDragIdx >= 0) { transferDragIdx = -1; persistTransfer(); }
      });
      ui.transferCanvas.addEventListener("contextmenu", (ev) => ev.preventDefault());
    }
    function resetTransfer() {
      transferPoints = [
        { x: 0, y: 0 },
        { x: 0.25, y: 0.25 },
        { x: 0.5, y: 0.5 },
        { x: 0.75, y: 0.75 },
        { x: 1, y: 1 }
      ];
      refreshTransferCanvas();
      persistTransfer();
    }
    function invertTransfer() {
      transferPoints = transferPoints.map((p) => ({ x: p.x, y: 1 - p.y }));
      refreshTransferCanvas();
      persistTransfer();
    }
    function easeTransfer() {
      transferPoints = [
        { x: 0, y: 0 },
        { x: 0.25, y: 0.06 },
        { x: 0.5, y: 0.5 },
        { x: 0.75, y: 0.94 },
        { x: 1, y: 1 }
      ];
      refreshTransferCanvas();
      persistTransfer();
    }
    function stepTransfer() {
      transferPoints = [
        { x: 0, y: 0 },
        { x: 0.33, y: 0 },
        { x: 0.34, y: 0.5 },
        { x: 0.66, y: 0.5 },
        { x: 0.67, y: 1 },
        { x: 1, y: 1 }
      ];
      refreshTransferCanvas();
      persistTransfer();
    }
    function persistTransfer() {
      return safeLocalJsonSet(LS_TRANSFER_KEY, transferPoints, 32 * 1024);
    }
    function loadTransfer() {
      const arr = safeLocalJsonGet(LS_TRANSFER_KEY, null);
      if (!Array.isArray(arr)) return;
      const cleaned = arr
        .filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y))
        .slice(0, TRANSFER_MAX_POINTS);
      if (cleaned.length >= 2) {
        cleaned.sort((a, b) => a.x - b.x);
        // dedupe identical x to keep evalTransferAt monotonic
        const dedup = [cleaned[0]];
        for (let i = 1; i < cleaned.length; i += 1) {
          if (cleaned[i].x > dedup[dedup.length - 1].x + 1e-6) dedup.push(cleaned[i]);
        }
        transferPoints = dedup;
      }
    }
    function applyTransfer() {
      if (!ir) { showToast("Compile IR first.", "warn"); return; }
      const ch = ui.transferChannel ? ui.transferChannel.value : "";
      if (!ch) { showToast("Pick a channel.", "warn"); return; }
      let mn = Infinity, mx = -Infinity;
      for (const e of ir.entities) {
        const v = ensureFinite(e[ch]);
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
      if (!Number.isFinite(mn) || !Number.isFinite(mx) || mn === mx) {
        showToast("Channel constant; nothing to remap.", "warn");
        return;
      }
      const span = mx - mn;
      let touched = 0;
      for (const e of ir.entities) {
        const v = ensureFinite(e[ch]);
        const t = clamp((v - mn) / span, 0, 1);
        const tt = clamp(evalTransferAt(t), 0, 1);
        const next = mn + tt * span;
        if (Math.abs(next - v) > 1e-9) { e[ch] = next; touched += 1; }
      }
      previewIr = null;
      renderCurrent();
      if (ui.transferStatus) ui.transferStatus.textContent = `remapped ${touched} entries on ${ch}.`;
      showToast(`Transfer applied to ${touched} entities.`, "ok");
    }
    function emitTransferAsPhase3() {
      const ch = ui.transferChannel ? ui.transferChannel.value : "";
      if (!ch) { showToast("Pick a channel.", "warn"); return; }
      const pts = transferPoints.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" ");
      const line = `# transfer ${ch} ${pts}`;
      const cur = ui.phase3Input.value;
      const sep = (cur.endsWith("\n") || !cur.length) ? "" : "\n";
      ui.phase3Input.value = cur + sep + line + "\n";
      if (macroRecording) recordMacroLine(line);
      showToast("Transfer recipe appended to Phase 3 (commented).", "ok");
    }

    // ----- Frame strip ---------------------------------------------------
    function refreshFrameStrip() {
      if (!ui.frameStrip) return;
      const activeIr = previewIr || ir;
      if (!activeIr) {
        ui.frameStrip.innerHTML = '<div class="small" style="color:var(--muted);padding:6px">No IR yet.</div>';
        if (ui.frameStripStatus) ui.frameStripStatus.textContent = "";
        return;
      }
      const count = numInput(ui.frameStripCount, 2, 32, 8);
      const span = numInput(ui.frameStripSpan, 0.1, 40, 4);
      const start = stageTime;
      const frags = [];
      for (let i = 0; i < count; i += 1) {
        const t = start + (span * i) / Math.max(1, count - 1);
        const svg = emitSvg(activeIr, t, true);
        const tile = document.createElement("div");
        tile.style.cssText = "min-width:120px;width:120px;height:80px;border:1px solid var(--line);border-radius:6px;overflow:hidden;cursor:pointer;position:relative;background:var(--panel-2);flex:0 0 auto";
        tile.innerHTML = svg + `<span style="position:absolute;left:4px;bottom:2px;padding:1px 4px;border-radius:4px;background:rgba(0,0,0,0.55);color:var(--ink);font-size:0.65rem;font-family:ui-monospace,Menlo,Consolas,monospace">t=${t.toFixed(2)}</span>`;
        tile.addEventListener("click", () => {
          stageTime = t;
          if (ui.timeScrub) ui.timeScrub.value = String(t);
          renderCurrent();
          showToast(`t = ${t.toFixed(2)}`, "ok");
        });
        frags.push(tile);
      }
      ui.frameStrip.innerHTML = "";
      for (const f of frags) ui.frameStrip.appendChild(f);
      if (ui.frameStripStatus) ui.frameStripStatus.textContent = `${count} frames · ${span.toFixed(2)}s span · t₀=${start.toFixed(2)}`;
    }

    // ----- Macro recorder ------------------------------------------------
    function persistMacroRecorder() {
      return safeLocalJsonSet(LS_MACRO_REC_KEY, { on: macroRecording, lines: macroRecorderLines }, 64 * 1024);
    }
    function loadMacroRecorder() {
      const data = safeLocalJsonGet(LS_MACRO_REC_KEY, null);
      if (!data || !Array.isArray(data.lines)) return;
      for (const ln of data.lines.slice(0, 200)) {
        if (typeof ln === "string" && ln.length < 200) macroRecorderLines.push(ln);
      }
      macroRecording = !!data.on;
    }
    function refreshMacroRecorderUi() {
      if (!ui.macroRecorderBuffer) return;
      ui.macroRecorderBuffer.textContent = macroRecorderLines.join("\n") || "(buffer empty)";
      if (ui.btnMacroRecToggle) ui.btnMacroRecToggle.textContent = macroRecording ? "■ Recording" : "● Record";
      if (ui.macroRecorderStatus) ui.macroRecorderStatus.textContent = `${macroRecorderLines.length} line${macroRecorderLines.length === 1 ? "" : "s"} · ${macroRecording ? "recording" : "idle"}`;
    }
    function recordMacroLine(line) {
      if (!macroRecording) return;
      const trimmed = String(line || "").trim();
      if (!trimmed) return;
      if (macroRecorderLines.length >= 200) macroRecorderLines.shift();
      macroRecorderLines.push(trimmed);
      persistMacroRecorder();
      refreshMacroRecorderUi();
    }
    function toggleMacroRecorder() {
      macroRecording = !macroRecording;
      persistMacroRecorder();
      refreshMacroRecorderUi();
      showToast(macroRecording ? "Macro recorder ON." : "Macro recorder paused.", "ok");
    }
    function clearMacroRecorder() {
      macroRecorderLines.length = 0;
      persistMacroRecorder();
      refreshMacroRecorderUi();
    }
    function saveMacroRecorder() {
      const rawName = (ui.macroRecordName && ui.macroRecordName.value || "").trim().slice(0, 32);
      if (!rawName) { showToast("Macro name required.", "warn"); return; }
      const name = rawName.toLowerCase();
      if (!/^[a-z0-9_\-]+$/.test(name)) { showToast("Use lowercase letters, digits, _ or -", "warn"); return; }
      if (!macroRecorderLines.length) { showToast("Buffer is empty.", "warn"); return; }
      const body = macroRecorderLines.join("\n");
      if (body.length > MAX_CUSTOM_MACRO_BYTES) { showToast("Macro body too large.", "error"); return; }
      customMacros.set(name, { body, savedAt: new Date().toISOString() });
      persistCustomMacros();
      refreshCustomMacroUi();
      showToast(`Macro "${name}" saved (${macroRecorderLines.length} lines).`, "ok");
    }
    function appendMacroRecorderToPhase3() {
      if (!macroRecorderLines.length) { showToast("Buffer is empty.", "warn"); return; }
      const cur = ui.phase3Input.value;
      const sep = (cur.endsWith("\n") || !cur.length) ? "" : "\n";
      ui.phase3Input.value = cur + sep + macroRecorderLines.join("\n") + "\n";
      compileAndReport();
      showToast(`Appended ${macroRecorderLines.length} lines to Phase 3.`, "ok");
    }

    // ─── Prime Lab — Hamiltonian-flow DSL emitter ─────────────────────────
    //
    // Architecture: this panel is an *input device* for the Phase 3 textarea,
    // not a parallel control plane. Slider gestures cause one DSL line to be
    // appended on `change` (release), and the textarea remains the source of
    // truth. Session bundles, A/B compare, scrubbing, and the cross-port
    // smokes all keep working without panel-specific persistence.
    //
    // Why `change` and not `input`: emitting on every continuous slider tick
    // would flood the textarea. `change` fires on release / commit, which
    // produces one line per discrete user gesture — exactly what the Macro
    // Recorder pattern wants.
    //
    // Why we recompile on emit: every `prime` line is a parameter/state edit
    // that affects subsequent passes. Auto-compile keeps the diagnostic
    // readout (and the rest of the pipeline) in sync. Users who want to
    // batch-edit can disable auto-compile via the checkbox.
    const primeLabRecentLines = [];
    function refreshPrimeLabValueLabels() {
      if (!ui.primeLabKappa || !ui.primeLabKappaVal) return;
      ui.primeLabKappaVal.textContent = (+ui.primeLabKappa.value).toFixed(2);
      ui.primeLabEtaVal.textContent = (+ui.primeLabEta.value).toFixed(2);
      ui.primeLabEpsVal.textContent = (+ui.primeLabEps.value).toFixed(3);
    }
    function emitPrimeLabLine(line) {
      const trimmed = String(line || "").trim();
      if (!trimmed) return;
      const cur = ui.phase3Input.value;
      const sep = (cur.endsWith("\n") || !cur.length) ? "" : "\n";
      ui.phase3Input.value = cur + sep + trimmed + "\n";
      primeLabRecentLines.push(trimmed);
      while (primeLabRecentLines.length > 8) primeLabRecentLines.shift();
      if (ui.primeLabEmitTail) {
        ui.primeLabEmitTail.textContent = primeLabRecentLines.join("\n");
        // Pin to bottom so the latest line is always visible.
        ui.primeLabEmitTail.scrollTop = ui.primeLabEmitTail.scrollHeight;
      }
      if (typeof recordMacroLine === "function" && macroRecording) recordMacroLine(trimmed);
      const auto = ui.primeLabAutoCompile && ui.primeLabAutoCompile.checked;
      if (auto && typeof compileAndReport === "function") compileAndReport();
      if (ui.primeLabStatus) {
        ui.primeLabStatus.textContent = "emitted: " + primeLabRecentLines.length
          + (auto ? " · auto-compile on" : " · paused");
      }
    }
    function emitPrimeLabAllParams() {
      // 6 lines: mode, order, dt, couple, trap, soft. We emit them in the
      // order the standalone Phase 4 tool's preset-load uses, so that the
      // resulting pipeline reads naturally as a regime declaration.
      const lines = [
        "prime mode " + ui.primeLabMode.value,
        "prime order " + ui.primeLabOrder.value,
        "prime dt " + (+ui.primeLabDt.value).toFixed(4),
        "prime couple " + (+ui.primeLabKappa.value).toFixed(2),
        "prime trap " + (+ui.primeLabEta.value).toFixed(2),
        "prime soft " + (+ui.primeLabEps.value).toFixed(3),
      ];
      const cur = ui.phase3Input.value;
      const sep = (cur.endsWith("\n") || !cur.length) ? "" : "\n";
      ui.phase3Input.value = cur + sep + lines.join("\n") + "\n";
      for (const l of lines) {
        primeLabRecentLines.push(l);
        if (typeof recordMacroLine === "function" && macroRecording) recordMacroLine(l);
      }
      while (primeLabRecentLines.length > 8) primeLabRecentLines.shift();
      if (ui.primeLabEmitTail) {
        ui.primeLabEmitTail.textContent = primeLabRecentLines.join("\n");
        ui.primeLabEmitTail.scrollTop = ui.primeLabEmitTail.scrollHeight;
      }
      const auto = ui.primeLabAutoCompile && ui.primeLabAutoCompile.checked;
      if (auto && typeof compileAndReport === "function") compileAndReport();
      showToast("Appended 6 prime lines to Phase 3.", "ok");
    }
    function refreshPrimeLabDiagnostic() {
      // Read the current IR (preferring the post-Phase-3 result), and pull
      // ir.meta.phase4 + a one-shot energy/invariants from primeEnergy. The
      // builder doesn't run a live simulation; this is a snapshot of what
      // the *most recent compile* produced. Matches the standalone tool's
      // panel for easy mental cross-reference.
      if (!ui.primeLabDiagH) return;
      const activeIr = (typeof previewIr !== "undefined" && previewIr) || (typeof ir !== "undefined" && ir);
      const blank = () => {
        ui.primeLabDiagParams.textContent = "—";
        ui.primeLabDiagStep.textContent = "—";
        ui.primeLabDiagH.textContent = "—";
        ui.primeLabDiagK.textContent = "—";
        ui.primeLabDiagVpair.textContent = "—";
        ui.primeLabDiagVconf.textContent = "—";
        ui.primeLabDiagLz.textContent = "—";
        ui.primeLabDiagP.textContent = "—";
      };
      if (!activeIr || !Array.isArray(activeIr.entities) || !activeIr.entities.length) {
        blank();
        return;
      }
      const meta4 = activeIr.meta && activeIr.meta.phase4;
      if (!meta4 || !meta4.params) {
        ui.primeLabDiagParams.textContent = "(no prime params yet)";
        ui.primeLabDiagStep.textContent = "—";
        ui.primeLabDiagH.textContent = "—";
        ui.primeLabDiagK.textContent = "—";
        ui.primeLabDiagVpair.textContent = "—";
        ui.primeLabDiagVconf.textContent = "—";
        ui.primeLabDiagLz.textContent = "—";
        ui.primeLabDiagP.textContent = "—";
        return;
      }
      const p = meta4.params;
      ui.primeLabDiagParams.textContent =
        "mode=" + (p.mode || "?")
        + " order=" + (p.order || "?")
        + " dt=" + (Number.isFinite(+p.dt) ? (+p.dt).toFixed(4) : "?")
        + " κ=" + (Number.isFinite(+p.kappa) ? (+p.kappa).toFixed(2) : "?")
        + " η=" + (Number.isFinite(+p.eta) ? (+p.eta).toFixed(2) : "?")
        + " ε=" + (Number.isFinite(+p.eps) ? (+p.eps).toFixed(3) : "?");
      ui.primeLabDiagStep.textContent = String(meta4.evolveStep || 0);
      try {
        if (typeof primeLift === "function" && typeof primeEnergy === "function" && typeof primeInvariants === "function") {
          const ens = primeLift(activeIr.entities);
          const en = primeEnergy(ens, p);
          const inv = primeInvariants(ens);
          ui.primeLabDiagH.textContent = Number.isFinite(en.H) ? en.H.toExponential(3) : "—";
          ui.primeLabDiagK.textContent = Number.isFinite(en.K) ? en.K.toExponential(3) : "—";
          ui.primeLabDiagVpair.textContent = Number.isFinite(en.V_pair) ? en.V_pair.toExponential(3) : "—";
          ui.primeLabDiagVconf.textContent = Number.isFinite(en.V_conf) ? en.V_conf.toExponential(3) : "—";
          ui.primeLabDiagLz.textContent = Number.isFinite(inv.Lz) ? inv.Lz.toExponential(3) : "—";
          ui.primeLabDiagP.textContent = Number.isFinite(inv.P) ? inv.P.toFixed(3) : "—";
        }
      } catch (e) {
        // Energy/invariants are computed defensively — a malformed entity
        // shouldn't take down the panel.
        if (ui.primeLabStatus) ui.primeLabStatus.textContent = "diag err: " + e.message;
      }
    }

    // ─── Phase Portrait — (q_x, p_x) trails on a non-destructive snapshot ──
    //
    // The portrait widget is the "output device" companion to the Prime Lab's
    // "input device" role. It snapshots the current IR's entities, advances
    // the prime kernel from that snapshot for N forward steps, and plots
    // (q_x, p_x) trails for the first few entities. The IR is *not* mutated;
    // this is a pure visualisation of the trajectory the current parameter
    // set would produce on the current state.
    //
    // Pairing with named macros: `prime macro kepler` should produce
    // (q_x, p_x) ellipses (closed orbits in q-p plane). `prime macro breather`
    // should produce nearly-radial bands (q oscillates with little p
    // structure). `prime macro cluster` should produce filled-region scatter
    // (chaotic but bounded). `prime macro harmonic` should produce a clean
    // ellipse (linear oscillator).
    //
    // The macros are *self-validating*: name → expected shape →
    // diagnostic signature. If a future kernel edit silently changes
    // dynamics in a way that preserves H but alters trajectory shape,
    // the portrait + the regression smoke catch it. (Plain H-conservation
    // alone wouldn't.)
    function primePortraitTrace() {
      if (!ui.primePortraitCanvas) return;
      const c = ui.primePortraitCanvas;
      const cx = c.getContext("2d");
      if (!cx) return;
      // Source IR. Prefer the post-Phase-3 result (matches the Lab diagnostic).
      const activeIr = (typeof previewIr !== "undefined" && previewIr) || (typeof ir !== "undefined" && ir);
      if (!activeIr || !Array.isArray(activeIr.entities) || !activeIr.entities.length) {
        if (ui.primePortraitStatus) ui.primePortraitStatus.textContent = "no entities";
        primePortraitClear();
        return;
      }
      const meta4 = activeIr.meta && activeIr.meta.phase4;
      if (!meta4 || !meta4.params || meta4.params.mode !== "H") {
        if (ui.primePortraitStatus) {
          ui.primePortraitStatus.textContent = meta4 && meta4.params
            ? "mode=" + meta4.params.mode + ": only H is integrable in builder"
            : "no prime params (run a `prime …` line first)";
        }
        primePortraitClear();
        return;
      }
      const params = meta4.params;
      // Configuration: how many entities, how many steps, sampling stride.
      const wantN = Math.min(activeIr.entities.length,
        Math.max(1, Math.min(32, Math.floor(+ui.primePortraitEntities.value) || 6)));
      const wantSteps = Math.max(50, Math.min(4000,
        Math.floor(+ui.primePortraitSteps.value) || 600));
      // Snapshot the entire ensemble — pair forces couple the plotted entities
      // to the rest of the system, so we must lift all of them. Plotting is
      // restricted to the first wantN.
      let ens, fx, fy;
      try {
        ens = primeLift(activeIr.entities);
        fx = new Float64Array(ens.N);
        fy = new Float64Array(ens.N);
      } catch (e) {
        if (ui.primePortraitStatus) ui.primePortraitStatus.textContent = "lift err: " + e.message;
        return;
      }
      // Sample stride: aim for ~600 points per trail max for crisp drawing.
      const stride = Math.max(1, Math.floor(wantSteps / 600));
      const sampledLen = Math.floor(wantSteps / stride);
      // Trails: trails[i] = { qx: Float64Array, px: Float64Array }
      const trails = new Array(wantN);
      for (let i = 0; i < wantN; i++) {
        trails[i] = {
          qx: new Float64Array(sampledLen),
          px: new Float64Array(sampledLen),
        };
      }
      // Advance the kernel and sample. p_x = m_i · v_x in this Hamiltonian
      // (mass = scale-channel value; lifted into ens.m by primeLift).
      let sampleIdx = 0;
      let blewUp = false;
      try {
        for (let s = 0; s < wantSteps; s++) {
          primeStep(ens, fx, fy, params);
          if ((s % stride) === 0 && sampleIdx < sampledLen) {
            for (let i = 0; i < wantN; i++) {
              const qx = ens.x[i];
              const px = ens.m[i] * ens.vx[i];
              if (!Number.isFinite(qx) || !Number.isFinite(px)) {
                blewUp = true;
                break;
              }
              trails[i].qx[sampleIdx] = qx;
              trails[i].px[sampleIdx] = px;
            }
            if (blewUp) break;
            sampleIdx++;
          }
        }
      } catch (e) {
        if (ui.primePortraitStatus) ui.primePortraitStatus.textContent = "step err: " + e.message;
        return;
      }
      const usedLen = sampleIdx;
      if (blewUp || usedLen < 4) {
        if (ui.primePortraitStatus) {
          ui.primePortraitStatus.textContent = blewUp
            ? "trajectory blew up (non-finite); try raising ε or lowering dt"
            : "too few samples";
        }
        return;
      }
      primePortraitDraw(trails, usedLen, params, wantN);
    }
    function primePortraitDraw(trails, usedLen, params, N) {
      const c = ui.primePortraitCanvas;
      const cx = c.getContext("2d");
      if (!cx) return;
      // Resize to the actual element width for crisp rendering on resize.
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = c.getBoundingClientRect();
      const tgtW = Math.max(64, Math.round(r.width * dpr));
      const tgtH = Math.max(64, Math.round((r.width * 0.5625) * dpr));
      if (c.width !== tgtW || c.height !== tgtH) {
        c.width = tgtW; c.height = tgtH;
      }
      const W = c.width, H = c.height;
      // Clear with the panel background colour (synthwave-friendly).
      cx.fillStyle = "rgba(10, 6, 26, 1)";
      cx.fillRect(0, 0, W, H);
      // Compute the bounding box across all trails so all entities share a frame.
      let qMin = Infinity, qMax = -Infinity, pMin = Infinity, pMax = -Infinity;
      for (let i = 0; i < N; i++) {
        const t = trails[i];
        for (let s = 0; s < usedLen; s++) {
          if (t.qx[s] < qMin) qMin = t.qx[s];
          if (t.qx[s] > qMax) qMax = t.qx[s];
          if (t.px[s] < pMin) pMin = t.px[s];
          if (t.px[s] > pMax) pMax = t.px[s];
        }
      }
      // Symmetric axes around 0 so the origin is centred (canonical phase-space view).
      const qExt = Math.max(Math.abs(qMin), Math.abs(qMax), 1e-9);
      const pExt = Math.max(Math.abs(pMin), Math.abs(pMax), 1e-9);
      const margin = 32 * dpr;
      const innerW = W - 2 * margin;
      const innerH = H - 2 * margin;
      const sx = innerW / (2 * qExt * 1.05);
      const sy = innerH / (2 * pExt * 1.05);
      const cxPx = W / 2, cyPx = H / 2;
      // Crosshair at origin.
      cx.strokeStyle = "rgba(140, 200, 230, 0.35)";
      cx.lineWidth = 1 * dpr;
      cx.beginPath();
      cx.moveTo(margin, cyPx); cx.lineTo(W - margin, cyPx);
      cx.moveTo(cxPx, margin); cx.lineTo(cxPx, H - margin);
      cx.stroke();
      // Frame.
      cx.strokeStyle = "rgba(140, 200, 230, 0.20)";
      cx.strokeRect(margin, margin, innerW, innerH);
      // Axis labels.
      cx.fillStyle = "rgba(180, 220, 240, 0.7)";
      cx.font = (11 * dpr).toFixed(0) + "px ui-monospace, monospace";
      cx.textBaseline = "top";
      cx.fillText("q_x", W - margin - 24 * dpr, cyPx + 4 * dpr);
      cx.fillText("p_x", cxPx + 4 * dpr, margin);
      cx.textBaseline = "alphabetic";
      // Trails. Each entity gets a colour spaced around the hue wheel.
      cx.lineWidth = 1.4 * dpr;
      cx.globalCompositeOperation = "lighter";
      for (let i = 0; i < N; i++) {
        const t = trails[i];
        const hue = (i * 137.508) % 360;  // golden angle for nice spread
        cx.strokeStyle = `hsla(${hue.toFixed(1)}, 90%, 65%, 0.75)`;
        cx.beginPath();
        for (let s = 0; s < usedLen; s++) {
          const px = cxPx + t.qx[s] * sx;
          const py = cyPx - t.px[s] * sy;  // flip y so +p is up
          if (s === 0) cx.moveTo(px, py); else cx.lineTo(px, py);
        }
        cx.stroke();
        // Endpoint dot — current position in (q, p).
        const endX = cxPx + t.qx[usedLen - 1] * sx;
        const endY = cyPx - t.px[usedLen - 1] * sy;
        cx.fillStyle = `hsla(${hue.toFixed(1)}, 95%, 75%, 1)`;
        cx.beginPath();
        cx.arc(endX, endY, 2.5 * dpr, 0, Math.PI * 2);
        cx.fill();
      }
      cx.globalCompositeOperation = "source-over";
      if (ui.primePortraitStatus) {
        ui.primePortraitStatus.textContent =
          "mode=" + params.mode
          + " order=" + params.order
          + " dt=" + (+params.dt).toFixed(4)
          + " · " + N + " entities × " + usedLen + " samples"
          + " · q-extent=" + qExt.toExponential(2)
          + ", p-extent=" + pExt.toExponential(2);
      }
      if (ui.primePortraitLegend) {
        const macro = (window.previewIr && previewIr.meta && previewIr.meta.phase4 && previewIr.meta.phase4.lastMacro)
          || (window.ir && ir.meta && ir.meta.phase4 && ir.meta.phase4.lastMacro)
          || null;
        if (macro && typeof PRIME_MACROS !== "undefined" && PRIME_MACROS[macro]) {
          ui.primePortraitLegend.innerHTML =
            "<b>last macro: " + macro + "</b> — expected shape: <i>"
            + PRIME_MACROS[macro].portraitShape + "</i> · signature: "
            + PRIME_MACROS[macro].sig;
        } else {
          ui.primePortraitLegend.textContent =
            "(no named macro applied yet — pick one of kepler / breather / cluster / harmonic to anchor the portrait against an expected shape)";
        }
      }
    }
    function primePortraitClear() {
      if (!ui.primePortraitCanvas) return;
      const cx = ui.primePortraitCanvas.getContext("2d");
      if (!cx) return;
      cx.fillStyle = "rgba(10, 6, 26, 1)";
      cx.fillRect(0, 0, ui.primePortraitCanvas.width, ui.primePortraitCanvas.height);
    }
    function emitPrimeMacroLine(name) {
      // Append `prime macro <name>` to Phase 3, optionally trigger a recompile,
      // and (after compile) auto-trace the portrait so the "name → shape"
      // round-trip is one click. Recording integrates with the Macro Recorder
      // exactly like emitPrimeLabLine.
      if (typeof PRIME_MACROS === "undefined" || !PRIME_MACROS[name]) {
        showToast("Unknown prime macro: " + name, "err");
        return;
      }
      const line = "prime macro " + name;
      const cur = ui.phase3Input.value;
      const sep = (cur.endsWith("\n") || !cur.length) ? "" : "\n";
      ui.phase3Input.value = cur + sep + line + "\n";
      primeLabRecentLines.push(line);
      while (primeLabRecentLines.length > 8) primeLabRecentLines.shift();
      if (ui.primeLabEmitTail) {
        ui.primeLabEmitTail.textContent = primeLabRecentLines.join("\n");
        ui.primeLabEmitTail.scrollTop = ui.primeLabEmitTail.scrollHeight;
      }
      if (typeof recordMacroLine === "function" && macroRecording) recordMacroLine(line);
      const auto = ui.primeLabAutoCompile && ui.primeLabAutoCompile.checked;
      if (auto && typeof compileAndReport === "function") {
        compileAndReport();
        // After compile: auto-trace the portrait so name → shape verification
        // is one click. Defer to next frame so DOM has settled.
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(() => primePortraitTrace());
        } else {
          setTimeout(() => primePortraitTrace(), 0);
        }
      }
      showToast("Appended `" + line + "` to Phase 3.", "ok");
    }

    function applyLocalDraftData(d) {
      if (!d || d.v !== 1) return;
      if (d.builderDsl != null) ui.builderDsl.value = String(d.builderDsl);
      if (d.matrixText != null) ui.matrixInput.value = String(d.matrixText);
      if (d.phase2 != null) ui.phase2Input.value = String(d.phase2);
      if (d.phase3 != null) ui.phase3Input.value = String(d.phase3);
      if (d.seed != null) ui.seed.value = String(d.seed);
      if (d.entityCount != null) {
        ui.entityCount.value = String(clamp(Math.floor(Number(d.entityCount)) || 120, 1, MAX_ENTITIES));
      }
      if (d.profile && ["swarm", "mandala", "glitch"].includes(d.profile)) ui.profile.value = d.profile;
      if (ui.deltaHeatOnB) ui.deltaHeatOnB.checked = !!d.deltaHeatOnB;
      if (ui.autoPreviewScrub) ui.autoPreviewScrub.checked = d.autoPreviewScrub !== false;
      if (ui.abSwapPanes) ui.abSwapPanes.checked = !!d.abSwapPanes;
    }
    function showDraftBarIfAny() {
      if (!ui.draftHint) return;
      const d = readSessionDraft();
      if (!d || !d.at) {
        ui.draftHint.innerHTML = "";
        return;
      }
      const when = new Date(d.at);
      const label = isNaN(when.getTime()) ? "?" : when.toLocaleString();
      ui.draftHint.innerHTML = `<span class="small" style="color:var(--muted)">Text draft</span> · saved ${escapeHtml(label)} <button type="button" id="btnApplyDraft">Apply</button> <button type="button" id="btnClearDraft">Clear</button>`;
    }
    function isTypingContext(el) {
      if (!el || !el.tagName) return false;
      const t = el.tagName.toLowerCase();
      if (t === "textarea" || t === "select") return true;
      if (t === "input") {
        const ty = (el.type || "").toLowerCase();
        if (ty === "checkbox" || ty === "radio" || ty === "button" || ty === "file") return false;
        return true;
      }
      return el.isContentEditable;
    }

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function ensureFinite(v, fallback = 0) { return Number.isFinite(v) ? v : fallback; }
    // ---------- core helpers (storage, input, scheduling) ----------
    function safeLocalGet(key) {
      try { return localStorage.getItem(key); } catch (_e) { return null; }
    }
    function safeLocalSet(key, value) {
      try { localStorage.setItem(key, value); return true; } catch (_e) { return false; }
    }
    function safeLocalRemove(key) {
      try { localStorage.removeItem(key); return true; } catch (_e) { return false; }
    }
    function safeJsonParse(raw, fallback) {
      if (raw == null) return fallback;
      try { return JSON.parse(raw); } catch (_e) { return fallback; }
    }
    function safeLocalJsonGet(key, fallback) {
      return safeJsonParse(safeLocalGet(key), fallback);
    }
    function safeLocalJsonSet(key, value, maxBytes) {
      try {
        const s = JSON.stringify(value);
        if (typeof maxBytes === "number" && s.length > maxBytes) return false;
        return safeLocalSet(key, s);
      } catch (_e) { return false; }
    }
    function numInput(el, lo, hi, def) {
      if (!el) return def;
      const n = Number(el.value);
      if (!Number.isFinite(n)) return def;
      return clamp(n, lo, hi);
    }
    function boolInput(el, def) {
      return el ? !!el.checked : !!def;
    }
    function selectValue(el, fallback) {
      return (el && typeof el.value === "string" && el.value.length) ? el.value : (fallback || "");
    }
    function withErr(label, fn) {
      try { return fn(); }
      catch (e) {
        try { console.error("[svg42:" + label + "]", e); } catch (_e) { /* ignore */ }
        try { showToast(label + ": " + (e && e.message || e), "error"); } catch (_e) { /* ignore */ }
        return undefined;
      }
    }
    // ---------- analytical-panel dirty tracking + rAF flush ----------
    const analyticsDirty = new Set();
    let analyticsFlushScheduled = false;
    function markAnalyticsDirty() {
      for (let i = 0; i < arguments.length; i += 1) analyticsDirty.add(arguments[i]);
      if (analyticsFlushScheduled) return;
      analyticsFlushScheduled = true;
      const schedule = (typeof requestAnimationFrame === "function") ? requestAnimationFrame : (cb) => setTimeout(cb, 16);
      schedule(flushAnalytics);
    }
    function flushAnalytics() {
      analyticsFlushScheduled = false;
      const tasks = Array.from(analyticsDirty);
      analyticsDirty.clear();
      for (const name of tasks) {
        const fn = ANALYTICS_REFRESHERS[name];
        if (typeof fn === "function") withErr("flush:" + name, fn);
      }
    }
    const ANALYTICS_REFRESHERS = {};
    function registerAnalytics(name, fn) { ANALYTICS_REFRESHERS[name] = fn; }
    function irStructHash(activeIr) {
      if (!activeIr) return "0";
      const e = activeIr.entities;
      if (!e || !e.length) return "0";
      const last = e[e.length - 1];
      const lastId = (last && last.id != null) ? last.id : 0;
      const schemaLen = (activeIr.schema && activeIr.schema.length) || 0;
      const cpLen = (activeIr.meta && Array.isArray(activeIr.meta.phase3Checkpoints)) ? activeIr.meta.phase3Checkpoints.length : 0;
      return e.length + ":" + lastId + ":" + schemaLen + ":" + cpLen;
    }
    // ---------- atlas histogram cache ----------
    const _atlasHistCache = new Map();
    let _atlasCacheKey = null;
    function getCachedHistogram(activeIr, channel, bins) {
      const key = irStructHash(activeIr) + ":" + bins;
      if (_atlasCacheKey !== key) {
        _atlasHistCache.clear();
        _atlasCacheKey = key;
      }
      const sub = channel + "@" + bins;
      let h = _atlasHistCache.get(sub);
      if (h) return h;
      const values = activeIr.entities.map((e) => ensureFinite(e[channel]));
      h = buildHistogram(values, bins);
      _atlasHistCache.set(sub, h);
      return h;
    }
    function invalidateAtlasCache() { _atlasHistCache.clear(); _atlasCacheKey = null; }
    function escapeHtml(text) {
      return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
    }
    function encodeScriptJson(value) {
      return JSON.stringify(value).replaceAll("<", "\\u003c");
    }
    function wrap360(v) {
      let x = v % 360;
      if (x < 0) x += 360;
      return x;
    }
    function mulberry32(seed) {
      let t = seed >>> 0;
      return function() {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
      };
    }

    function parseDsl(text) {
      if (text.length > MAX_TEXT_CHARS) throw new Error("DSL input too large.");
      const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      const out = Array.from({ length: ROW_COUNT }, (_, i) => ({
        row: i + 1,
        name: DEFAULT_NAMES[i] || `r${i + 1}`,
        min: 0,
        max: 1,
        mode: "linear"
      }));
      for (const line of lines) {
        if (line.startsWith("#")) continue;
        const parts = line.split(/\s+/);
        if (parts.length < 5) throw new Error(`DSL line malformed: "${line}"`);
        const row = Number(parts[0]);
        const name = parts[1];
        const min = Number(parts[2]);
        const max = Number(parts[3]);
        const mode = parts[4];
        if (!Number.isFinite(row) || row < 1 || row > ROW_COUNT) throw new Error(`Invalid row index in "${line}"`);
        if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) throw new Error(`Invalid range in "${line}"`);
        if (!MODES.has(mode)) throw new Error(`Invalid mode "${mode}" in "${line}"`);
        if (!SAFE_NAME_RE.test(name)) throw new Error(`Unsafe channel name "${name}" in "${line}"`);
        out[row - 1] = { row, name, min, max, mode };
      }
      return out;
    }

    function parseNumericRow(raw) {
      const line = raw.includes(":") ? raw.slice(raw.indexOf(":") + 1) : raw;
      const tokens = line.trim().split(/[,\s]+/).filter(Boolean);
      const out = [];
      for (const token of tokens) {
        const v = Number(token);
        if (!Number.isFinite(v)) throw new Error(`Invalid numeric token "${token}".`);
        if (Math.abs(v) > MAX_CELL_ABS) throw new Error(`Numeric token out of bounds: "${token}".`);
        out.push(v);
      }
      return out;
    }

    function parseRows(inputText) {
      if (inputText.length > MAX_TEXT_CHARS) throw new Error("Matrix input too large.");
      const lines = inputText.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      if (lines.length < ROW_COUNT) throw new Error(`Need ${ROW_COUNT} rows, got ${lines.length}.`);
      const rows = [];
      for (let i = 0; i < ROW_COUNT; i += 1) rows.push(parseNumericRow(lines[i]));
      const width = rows[0].length;
      if (!width) throw new Error("Row 1 is empty.");
      if (width > MAX_ENTITIES) throw new Error(`Entity cap exceeded: ${width} > ${MAX_ENTITIES}.`);
      rows.forEach((row, idx) => {
        if (row.length !== width) throw new Error(`Row ${idx + 1} length ${row.length} != ${width}.`);
      });
      return rows;
    }
    function buildChannelMap(schemaDef) {
      const map = new Map();
      schemaDef.forEach((s, i) => {
        map.set(String(s.row), i);
        map.set(s.name.toLowerCase(), i);
      });
      return map;
    }
    function resolveRowRef(ref, channelMap) {
      const key = String(ref).toLowerCase();
      if (!channelMap.has(key)) throw new Error(`Unknown row/channel "${ref}"`);
      return channelMap.get(key);
    }

    function normalizeValue(v, spec) {
      switch (spec.mode) {
        case "wrap360": return wrap360(v);
        case "clamp01": return clamp(v, 0, 1);
        case "enum": return Math.round(clamp(v, spec.min, spec.max));
        default: return clamp(v, spec.min, spec.max);
      }
    }

    function compileToIR(rows, schemaDef) {
      const entityCount = rows[0].length;
      if (entityCount > MAX_ENTITIES) throw new Error(`Entity cap exceeded: ${entityCount} > ${MAX_ENTITIES}.`);
      const entities = [];
      for (let i = 0; i < entityCount; i += 1) {
        const e = { id: i };
        for (let r = 0; r < ROW_COUNT; r += 1) {
          const spec = schemaDef[r];
          e[spec.name] = normalizeValue(ensureFinite(rows[r][i]), spec);
        }
        entities.push(e);
      }
      return { schema: schemaDef, entities, meta: { schemaVersion: 2, hardened: true, maxEntities: MAX_ENTITIES } };
    }
    function validateIrShape(candidate) {
      if (!candidate || typeof candidate !== "object") throw new Error("IR must be an object.");
      if (!Array.isArray(candidate.schema) || candidate.schema.length !== ROW_COUNT) throw new Error("IR schema invalid.");
      if (!Array.isArray(candidate.entities)) throw new Error("IR entities missing.");
      if (candidate.entities.length > MAX_ENTITIES) throw new Error("IR exceeds entity cap.");
      for (const s of candidate.schema) {
        if (!s || typeof s !== "object" || !SAFE_NAME_RE.test(String(s.name || ""))) throw new Error("IR schema has unsafe channel name.");
      }
    }
    function passClamp(entities, key, minV, maxV) {
      for (const e of entities) e[key] = clamp(ensureFinite(e[key]), minV, maxV);
    }
    function passGain(entities, key, factor) {
      for (const e of entities) e[key] = ensureFinite(e[key]) * factor;
    }
    function passBias(entities, key, offset) {
      for (const e of entities) e[key] = ensureFinite(e[key]) + offset;
    }
    function passShuffle(entities, seed) {
      const rand = mulberry32(seed >>> 0);
      for (let i = entities.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rand() * (i + 1));
        const t = entities[i];
        entities[i] = entities[j];
        entities[j] = t;
      }
    }
    function passSort(entities, key, dir) {
      const sign = dir === "desc" ? -1 : 1;
      entities.sort((a, b) => (ensureFinite(a[key]) - ensureFinite(b[key])) * sign);
    }
    const PHASE3_MACROS = {
      "cinematic": ["gain scale 1.06", "bias light -4", "sort z asc"],
      "neon-drift": ["bias hue 24", "gain glow 1.35", "quantize hue 24"],
      "crystalize": ["quantize rot 12", "quantize hue 18", "gain strokeW 1.15"],
      "vapor": ["gain blur 1.6", "bias light 8", "gain fillAlpha 0.9"],
      "pixel-grid": ["quantize x 32", "quantize y 32", "quantize rot 8"],
      "rainfall": ["sort y asc", "bias y -40", "gain ampY 0.7"],
      "constellation": ["gain glow 1.6", "gain strokeW 1.4", "quantize hue 36", "sort z desc"],
      "calm": ["gain ampX 0.5", "gain ampY 0.5", "gain speed 0.4", "bias light 4"],
      "chaos": ["randomize hue 0 360", "randomize rot 0 360", "shuffle 99"],
      "ember": ["bias hue -30", "gain sat 1.3", "gain glow 1.3", "clamp light 35 70"],
      "ice-shard": ["bias hue 200", "gain sat 0.7", "quantize rot 16", "gain strokeW 1.2"],
      "starburst": ["sort hue asc", "bias scale 0.4", "gain ampX 1.6", "gain ampY 1.6"],
      "monochrome": ["gain sat 0.0", "bias light 6", "quantize light 6"],
      "split-warm-cool": ["bias hue -90", "quantize hue 6", "sort hue asc"],
      "ribbon": ["sort phase asc", "smooth y 4", "smooth x 4"],
      "centroid-pull": ["lerp x 0 0.35", "lerp y 0 0.35"]
    };
    function phase3MacroLines(name) {
      const n = String(name || "").toLowerCase();
      if (PHASE3_MACROS[n]) return PHASE3_MACROS[n].slice();
      if (customMacros && customMacros.has(n)) {
        return parseCustomMacroBody(customMacros.get(n).body);
      }
      throw new Error(`Unknown macro "${name}"`);
    }
    function parseCustomMacroBody(body) {
      return String(body || "")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s.length && !s.startsWith("#"));
    }
    function passSmooth(entities, key, k) {
      const n = entities.length;
      if (n < 2 || k < 1) return;
      const out = new Array(n);
      const w = Math.max(1, Math.min(20, Math.floor(k)));
      for (let i = 0; i < n; i += 1) {
        let sum = 0, count = 0;
        for (let j = -w; j <= w; j += 1) {
          const idx = i + j;
          if (idx < 0 || idx >= n) continue;
          sum += ensureFinite(entities[idx][key]);
          count += 1;
        }
        out[i] = count ? sum / count : ensureFinite(entities[i][key]);
      }
      for (let i = 0; i < n; i += 1) entities[i][key] = out[i];
    }
    function passLerp(entities, key, target, t) {
      const a = clamp(t, 0, 1);
      for (const e of entities) {
        const cur = ensureFinite(e[key]);
        e[key] = cur + (target - cur) * a;
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // README — Phase 4 / Prime architecture
    // ════════════════════════════════════════════════════════════════════════
    // Phase 4 is a 2D N-body symplectic Hamiltonian flow on entity (x, y)
    // positions and (vx, vy) momenta. It exists in two implementations by
    // design: this builder-side kernel — deterministic, integrated as
    // Phase 3 `prime ...` passes so checkpoints, A/B compare, the Prime
    // Lab panel, the Phase Portrait widget, and session bundles all
    // replay bit-for-bit — and the standalone exploratory tool at
    // tools/svg42/svg42_phase4_prime.html, which adds Mode A (stochastic
    // recurrence), the live conservation LED, and the energy-decomposition
    // strip plot. Both implementations share the same Hamiltonian, the
    // same velocity-Verlet base step, and the same Yoshida-4 composition
    // coefficients. The two are continuously verified to agree at the f64
    // bit level by the .compat_out/phase4_prime_bridge.js cross-port test.
    //
    // The full architecture — eight independent witnesses (energy /
    // angular-momentum / time-reversibility / Newton-3 / dt-halving /
    // cross-port bit-identity / permutation stability / macro signature),
    // the four-source macro validation chain, the two-classifier
    // distinction (decomposeDriftHint vs classifyExchange), the metrics
    // reference (|ΔH/H|, |ΔL_z/L_z₀|, σ_K/σ_H), the source-of-truth
    // boundaries, and the ULP/round-off ceiling per property — lives in
    // docs/rigor/PHASE4.md. The smoke files implementing those witnesses live
    // in .compat_out/phase4_*.js and .compat_out/prime_lab_smoke.js, with
    // .compat_out/phase4_invariants_under_edit.js as the meta-test that
    // fails if anyone removes or weakens any of the witness chains.
    // ════════════════════════════════════════════════════════════════════════

    // ─── Prime: symplectic Hamiltonian flow on the IR's (x, y) channels ────
    //
    // The Phase 4 standalone tool (tools/svg42/svg42_phase4_prime.html) implements a
    // genuine 2D N-body Hamiltonian flow over an Ensemble class. This module
    // is a port of that kernel into the main builder so a Phase 3 pipeline can
    // include `prime evolve <steps>` lines and produce checkpoints whose A/B
    // diff in the scrubber represents real symplectic phase-space evolution
    // rather than just linear channel arithmetic.
    //
    // Invariants of this port (verified by .compat_out/phase4_prime_bridge.js):
    //   • Same Hamiltonian H = K + V_pair + V_conf as the standalone tool.
    //   • Same kick-drift-kick velocity Verlet (`primeVerletSubstep`) so the
    //     base method is exactly time-symmetric (round-trip Φ_{+h}∘Φ_{−h} = id).
    //   • Same Yoshida (c, b, c) coefficients with c = 1/(2−2^{1/3}).
    //   • Same masses-from-`scale`-channel convention.
    //
    // Storage convention:
    //   • Positions live on `entity.x, entity.y` (already in the IR schema).
    //   • Velocities live on `entity.vx, entity.vy` (off-schema, optional).
    //     They survive shallow `entities.map(e => ({ ...e }))` and JSON
    //     round-trips, but don't appear in the user-visible schema, so other
    //     Phase 3 passes (gain/clamp/quantize/etc.) ignore them by default.
    //   • Configuration (mode, order, dt, κ, ε, η, ω²) lives on
    //     `ir.meta.phase4.params` and is updated by `prime <subcmd>` lines.
    const PRIME_DEFAULTS = Object.freeze({
      mode: "H", order: 2, dt: 0.005,
      kappa: 0.4, eps: 0.10, eta: 0.20,
      gamma: 0.3, beta: 0.1
    });
    // Named macros — known-good Phase 3 pipelines whose K/V/V signature is
    // documented and whose phase-space portrait is recognisable. Each macro
    // declares (a) its expected diagnostic signature, (b) a one-line
    // description of the regime, (c) the parameter set it lands the kernel
    // in, and (d) how many symplectic steps to advance.
    //
    // Every entry's signature is testable: the regression smoke
    // `phase4_macros_smoke.js` runs each macro from a fixed initial ensemble
    // and asserts the dominant subsystem matches `expectDominator`, the
    // σ_K/σ_H ratio falls in `expectSymRatio`, and the (q_x, p_x) trail's
    // bounding-box aspect ratio falls in `expectAspectRange`. Together, the
    // name → signature → portrait shape → diagnostic numbers chain gives a
    // four-source validation for each named regime.
    const PRIME_MACROS = Object.freeze({
      kepler: Object.freeze({
        sig: "low V_conf, high V_pair, K↔V_pair exchange dominant",
        desc: "Bound two-body-style orbit. Weak trap, moderate pair coupling, Yoshida-4 to keep the ellipse tight over many periods.",
        params: Object.freeze({ mode: "H", order: 4, dt: 0.005, kappa: 0.6, eta: 0.05, eps: 0.10 }),
        evolve: 200,
        // Portrait expectation: (q_x, p_x) traces an ellipse → aspect not 1
        // (orbit has different excursions in q vs p), bounded, no escape.
        expectDominator: "V_pair",
        portraitShape: "ellipse"
      }),
      breather: Object.freeze({
        sig: "V_conf-dominant, K↔V_conf exchange",
        desc: "Strong harmonic trap, weak pair coupling. The cloud breathes: radial expansion / contraction, energy oscillates between K and V_conf with V_pair quiet.",
        params: Object.freeze({ mode: "H", order: 2, dt: 0.008, kappa: 0.05, eta: 0.5, eps: 0.10 }),
        evolve: 200,
        expectDominator: "V_conf",
        // Entity 0's (q_x, p_x) trail is a closed orbit because q oscillates
        // with the radial pulse and p_x = m·v_x is 90° out of phase, so they
        // trace an ellipse. The "breath" is in the *amplitude* envelope and
        // the σ_V_conf >> σ_V_pair signature, not in the entity-0 portrait
        // shape (which is qualitatively the same as kepler's). The two
        // macros are distinguished diagnostically by expectDominator, not by
        // portraitShape — exactly the right division of labour: shape says
        // "is the system bound or chaotic", signature says "what physics".
        portraitShape: "ellipse"
      }),
      cluster: Object.freeze({
        sig: "balanced, σ_K/σ_H in chaotic regime",
        desc: "Many-body interacting cluster. All three subsystems active; trajectories chaotic but bounded by the trap.",
        params: Object.freeze({ mode: "H", order: 4, dt: 0.005, kappa: 0.4, eta: 0.2, eps: 0.08 }),
        evolve: 200,
        expectDominator: "balanced",
        portraitShape: "filled"
      }),
      harmonic: Object.freeze({
        sig: "trap-dominated, near-zero V_pair",
        desc: "Pure harmonic trap with negligible pair coupling. Linear oscillator — phase-space portrait is a clean ellipse.",
        params: Object.freeze({ mode: "H", order: 2, dt: 0.012, kappa: 0.0, eta: 0.5, eps: 0.10 }),
        evolve: 200,
        expectDominator: "V_conf",
        portraitShape: "ellipse"
      }),
    });
    function ensurePrimeMeta(ir) {
      if (!ir.meta) ir.meta = {};
      if (!ir.meta.phase4 || typeof ir.meta.phase4 !== "object") ir.meta.phase4 = {};
      if (!ir.meta.phase4.params || typeof ir.meta.phase4.params !== "object") {
        ir.meta.phase4.params = { ...PRIME_DEFAULTS };
      } else {
        // Fill any missing fields with defaults so older IRs upgrade cleanly.
        for (const k of Object.keys(PRIME_DEFAULTS)) {
          if (ir.meta.phase4.params[k] == null) ir.meta.phase4.params[k] = PRIME_DEFAULTS[k];
        }
      }
      if (!Number.isFinite(ir.meta.phase4.evolveStep)) ir.meta.phase4.evolveStep = 0;
      return ir.meta.phase4;
    }
    function primeLift(entities) {
      const N = entities.length;
      const out = {
        N,
        x:  new Float64Array(N),
        y:  new Float64Array(N),
        vx: new Float64Array(N),
        vy: new Float64Array(N),
        m:  new Float64Array(N),  // mass     = scale (kinetic + accel via F/m)
        c:  new Float64Array(N),  // "charge" = attract − repel (pair coupling)
      };
      for (let i = 0; i < N; i++) {
        const e = entities[i];
        out.x[i]  = ensureFinite(e.x);
        out.y[i]  = ensureFinite(e.y);
        out.vx[i] = Number.isFinite(e.vx) ? +e.vx : 0;
        out.vy[i] = Number.isFinite(e.vy) ? +e.vy : 0;
        out.m[i]  = Math.max(0.1, ensureFinite(e.scale));
        out.c[i]  = ensureFinite(e.attract) - ensureFinite(e.repel);
      }
      return out;
    }
    function primeCommit(entities, ens) {
      for (let i = 0; i < entities.length; i++) {
        entities[i].x  = ens.x[i];
        entities[i].y  = ens.y[i];
        entities[i].vx = ens.vx[i];
        entities[i].vy = ens.vy[i];
      }
    }
    // Force formulas EXACTLY match the standalone Phase 4 tool's _computeForces:
    //
    //   Pair:   V_pair  = Σ_{i<j} −G c_i c_j / √(|q_i−q_j|² + s²)
    //                       (charge-charge coupling, c = attract − repel)
    //           F_i,pair = −∇_{q_i} V_pair
    //                     = −Σ_{j≠i} G c_i c_j (q_i−q_j) / (|q_i−q_j|²+s²)^{3/2}
    //
    //   Trap:   V_conf  = Σ_i ½ ω² |q_i|²    (no mass factor)
    //           F_i,trap = −ω² q_i           (no mass factor — gives mass-
    //                                         dependent oscillation frequency
    //                                         a_i = F/m_i = −ω² q_i / m_i)
    //
    // The kinetic energy K = Σ_i ½ m_i |v_i|² uses scale-as-mass; the velocity
    // update v += (F/m) dt also divides by mass. Pair coupling is via charge
    // c, not mass, so unequal-mass particles can have equal/unequal coupling
    // independently of their inertia.
    function primeForces(ens, fx, fy, p) {
      const N = ens.N;
      const G = +p.kappa;
      const soft = Math.max(1e-3, +p.eps || 0.05);
      const s2 = soft * soft;
      const omega2 = 4 * Math.max(0, +p.eta || 0);
      fx.fill(0); fy.fill(0);
      for (let i = 0; i < N; i++) {
        const ci = ens.c[i];
        const xi = ens.x[i], yi = ens.y[i];
        for (let j = i + 1; j < N; j++) {
          const cj = ens.c[j];
          const dx = xi - ens.x[j];
          const dy = yi - ens.y[j];
          const r2 = dx * dx + dy * dy + s2;
          const inv_r3 = 1 / (r2 * Math.sqrt(r2));
          const k = -G * ci * cj * inv_r3;  // scalar; force on i = k·(q_i − q_j)
          const ax = k * dx, ay = k * dy;
          fx[i] += ax;  fy[i] += ay;
          fx[j] -= ax;  fy[j] -= ay;        // Newton 3rd law
        }
        if (omega2 > 0) {
          fx[i] += -omega2 * xi;            // unweighted trap force
          fy[i] += -omega2 * yi;
        }
      }
    }
    // 2nd-order time-symmetric base method (kick-drift-kick velocity Verlet).
    // Self-adjointness: applying with +h then −h returns to the start within
    // round-off; this is the property that makes the Yoshida composition
    // genuinely 4th-order (rather than silently order-2).
    function primeVerletSubstep(ens, fx, fy, p, h) {
      const N = ens.N;
      const half = h * 0.5;
      primeForces(ens, fx, fy, p);
      for (let i = 0; i < N; i++) {
        const inv_m = 1 / ens.m[i];
        ens.vx[i] += half * fx[i] * inv_m;
        ens.vy[i] += half * fy[i] * inv_m;
      }
      for (let i = 0; i < N; i++) {
        ens.x[i] += h * ens.vx[i];
        ens.y[i] += h * ens.vy[i];
      }
      primeForces(ens, fx, fy, p);
      for (let i = 0; i < N; i++) {
        const inv_m = 1 / ens.m[i];
        ens.vx[i] += half * fx[i] * inv_m;
        ens.vy[i] += half * fy[i] * inv_m;
      }
    }
    function primeStep(ens, fx, fy, p) {
      const dt = +p.dt;
      if (+p.order === 4) {
        // Yoshida (1990) composition: Y₄(τ) = Y₂(c·τ)∘Y₂(b·τ)∘Y₂(c·τ)
        //   c = 1 / (2 − 2^{1/3}),   b = −2^{1/3} c,   2c + b = 1.
        // Note b < 0 (negative-time middle substep) — a feature of the order-4
        // construction, not a bug. The composition remains symplectic and
        // time-reversible; |ΔH/H| ~ O(dt⁴) instead of O(dt²).
        const cbrt2 = Math.cbrt(2);
        const c = 1 / (2 - cbrt2);
        const b = -cbrt2 * c;
        primeVerletSubstep(ens, fx, fy, p, c * dt);
        primeVerletSubstep(ens, fx, fy, p, b * dt);
        primeVerletSubstep(ens, fx, fy, p, c * dt);
      } else {
        primeVerletSubstep(ens, fx, fy, p, dt);
      }
    }
    function primeEnergy(ens, p) {
      const N = ens.N;
      const G = +p.kappa;
      const soft = Math.max(1e-3, +p.eps || 0.05);
      const s2 = soft * soft;
      const omega2 = 4 * Math.max(0, +p.eta || 0);
      let K = 0, V_pair = 0, V_conf = 0;
      for (let i = 0; i < N; i++) {
        const v2 = ens.vx[i] * ens.vx[i] + ens.vy[i] * ens.vy[i];
        K += 0.5 * ens.m[i] * v2;
        // V_conf is unweighted by mass (matches standalone tool convention;
        // gives mass-dependent oscillation frequency a = -ω² q / m).
        const q2 = ens.x[i] * ens.x[i] + ens.y[i] * ens.y[i];
        V_conf += 0.5 * omega2 * q2;
      }
      // V_pair uses charge-charge coupling (c_i c_j), NOT mass-mass.
      for (let i = 0; i < N; i++) {
        const ci = ens.c[i];
        for (let j = i + 1; j < N; j++) {
          const dx = ens.x[i] - ens.x[j];
          const dy = ens.y[i] - ens.y[j];
          const r = Math.sqrt(dx * dx + dy * dy + s2);
          V_pair += -G * ci * ens.c[j] / r;
        }
      }
      return { K, V_pair, V_conf, V: V_pair + V_conf, H: K + V_pair + V_conf };
    }
    function primeInvariants(ens) {
      let Px = 0, Py = 0, Lz = 0;
      for (let i = 0; i < ens.N; i++) {
        const m = ens.m[i];
        Px += m * ens.vx[i];
        Py += m * ens.vy[i];
        Lz += m * (ens.x[i] * ens.vy[i] - ens.y[i] * ens.vx[i]);
      }
      return { Px, Py, P: Math.hypot(Px, Py), Lz };
    }
    // The user-facing pass: lift IR → ensemble, advance `steps` symplectic
    // steps, write positions+velocities back. Returns a small report so the
    // pipeline trace can show |ΔH/H| and |ΔL_z/L_z₀| for the segment.
    function passPrimeEvolve(ir, steps) {
      const meta4 = ensurePrimeMeta(ir);
      const params = meta4.params;
      if (params.mode !== "H") {
        // Mode A (the original PRIME stochastic recurrence) is intentionally
        // not ported into the main builder — it requires a per-pipeline RNG
        // and would defeat the determinism guarantees of `prime evolve`. The
        // standalone Phase 4 tool retains it for historical compatibility.
        return { steps, mode: params.mode, skipped: true };
      }
      const ens = primeLift(ir.entities);
      const fx = new Float64Array(ens.N);
      const fy = new Float64Array(ens.N);
      const before = primeEnergy(ens, params);
      const invBefore = primeInvariants(ens);
      for (let i = 0; i < steps; i++) primeStep(ens, fx, fy, params);
      const after = primeEnergy(ens, params);
      const invAfter = primeInvariants(ens);
      primeCommit(ir.entities, ens);
      meta4.evolveStep += steps;
      const lzScale = Math.max(Math.abs(invBefore.Lz), 1e-9);
      return {
        steps, mode: params.mode, order: params.order,
        dt: params.dt, kappa: params.kappa, eps: params.eps, eta: params.eta,
        H_before: before.H, H_after: after.H,
        H_drift: Math.abs(after.H - before.H) / Math.max(1e-9, Math.abs(before.H)),
        Lz_before: invBefore.Lz, Lz_after: invAfter.Lz,
        L_drift: Math.abs(invAfter.Lz - invBefore.Lz) / lzScale,
        cumStep: meta4.evolveStep
      };
    }

    function passRandomize(entities, key, lo, hi, seed) {
      const rand = mulberry32((Number(seed) >>> 0) || 17);
      const span = hi - lo;
      for (const e of entities) e[key] = lo + rand() * span;
    }
    function passSwirl(entities, angleDeg) {
      const rad = (angleDeg * Math.PI) / 180;
      const cs = Math.cos(rad), sn = Math.sin(rad);
      for (const e of entities) {
        const x = ensureFinite(e.x);
        const y = ensureFinite(e.y);
        e.x = x * cs - y * sn;
        e.y = x * sn + y * cs;
      }
    }
    function passAbs(entities, key) {
      for (const e of entities) e[key] = Math.abs(ensureFinite(e[key]));
    }
    function passPower(entities, key, exponent) {
      for (const e of entities) {
        const v = ensureFinite(e[key]);
        e[key] = v < 0 ? -Math.pow(-v, exponent) : Math.pow(v, exponent);
      }
    }
    function passStep(entities, key, threshold, lo, hi) {
      for (const e of entities) e[key] = ensureFinite(e[key]) < threshold ? lo : hi;
    }
    function passInvert(entities, key) {
      let min = Infinity, max = -Infinity;
      for (const e of entities) {
        const v = ensureFinite(e[key]);
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return;
      for (const e of entities) e[key] = max - (ensureFinite(e[key]) - min);
    }
    function passNormalize(entities, key, outMin, outMax) {
      let min = Infinity, max = -Infinity;
      for (const e of entities) {
        const v = ensureFinite(e[key]);
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return;
      const span = outMax - outMin;
      for (const e of entities) {
        const t = (ensureFinite(e[key]) - min) / (max - min);
        e[key] = outMin + t * span;
      }
    }
    function channelStats(entities, key) {
      let min = Infinity, max = -Infinity, sum = 0;
      const n = entities.length || 1;
      for (const e of entities) {
        const v = ensureFinite(e[key]);
        if (v < min) min = v;
        if (v > max) max = v;
        sum += v;
      }
      return { min, max, mean: sum / n };
    }
    function fmtStats(s) {
      return `min=${s.min.toFixed(3)} max=${s.max.toFixed(3)} mean=${s.mean.toFixed(3)}`;
    }
    function snapshotIr(irState) {
      return {
        schema: irState.schema.map((s) => ({ ...s })),
        entities: irState.entities.map((e) => ({ ...e })),
        meta: { ...irState.meta }
      };
    }
    function getEntityById(irState, entityId) {
      if (!irState || !Array.isArray(irState.entities)) return null;
      if (!Number.isFinite(entityId) || entityId < 0 || entityId >= irState.entities.length) return null;
      return irState.entities[entityId];
    }
    function updatePlotChannelOptions() {
      ui.plotChannel.innerHTML = "";
      const activeSchema = (Array.isArray(schema) && schema.length === ROW_COUNT) ? schema : parseDsl(DEFAULT_DSL);
      activeSchema.forEach((s, idx) => {
        const opt = document.createElement("option");
        opt.value = s.name;
        opt.textContent = `${idx + 1}:${s.name}`;
        ui.plotChannel.appendChild(opt);
      });
      if (activeSchema.find((s) => s.name === "hue")) ui.plotChannel.value = "hue";
    }
    function sparkline(values) {
      const bars = "▁▂▃▄▅▆▇█";
      if (!values.length) return "";
      let min = Infinity, max = -Infinity;
      for (const v of values) { if (v < min) min = v; if (v > max) max = v; }
      if (min === max) return bars[0].repeat(values.length);
      return values.map((v) => {
        const t = (v - min) / (max - min);
        const i = Math.max(0, Math.min(bars.length - 1, Math.round(t * (bars.length - 1))));
        return bars[i];
      }).join("");
    }
    function updateEntityInspector() {
      try {
        refreshEntityAnnotationUi();
        if (!Number.isFinite(selectedEntityId)) {
        ui.entityInspector.textContent = "Click an entity in stage to inspect.";
        return;
      }
      if (!ir) {
        ui.entityInspector.textContent = "Compile IR first.";
        return;
      }
      const cur = getEntityById(ir, selectedEntityId);
      if (!cur) {
        ui.entityInspector.textContent = `Entity ${selectedEntityId} not available in current IR.`;
        return;
      }
      const plotKey = ui.plotChannel.value || "hue";
      const cp = Array.isArray(ir.meta?.phase3Checkpoints) ? ir.meta.phase3Checkpoints : [];
      const trend = cp.map((c) => {
        const e = getEntityById(c.ir, selectedEntityId);
        return ensureFinite(e ? e[plotKey] : NaN);
      }).filter(Number.isFinite);
      const prev = previewIr ? getEntityById(previewIr, selectedEntityId) : null;
      const selectedIdx = Number(ui.checkpointSelect.value);
      const selectedCp = Number.isFinite(selectedIdx) && cp[selectedIdx] ? getEntityById(cp[selectedIdx].ir, selectedEntityId) : null;
      const lines = [];
      lines.push(`entity=${selectedEntityId} plot=${plotKey}`);
      lines.push(`trend: ${sparkline(trend)} (${trend.length} checkpoints)`);
      lines.push("");
      lines.push(`[current] x=${ensureFinite(cur.x).toFixed(3)} y=${ensureFinite(cur.y).toFixed(3)} scale=${ensureFinite(cur.scale).toFixed(3)} hue=${ensureFinite(cur.hue).toFixed(3)} life=${ensureFinite(cur.life).toFixed(3)}`);
      if (prev) {
        lines.push(`[preview] x=${ensureFinite(prev.x).toFixed(3)} y=${ensureFinite(prev.y).toFixed(3)} scale=${ensureFinite(prev.scale).toFixed(3)} hue=${ensureFinite(prev.hue).toFixed(3)} life=${ensureFinite(prev.life).toFixed(3)}`);
        lines.push(`[delta current-preview] dx=${(ensureFinite(cur.x)-ensureFinite(prev.x)).toFixed(3)} dy=${(ensureFinite(cur.y)-ensureFinite(prev.y)).toFixed(3)} dscale=${(ensureFinite(cur.scale)-ensureFinite(prev.scale)).toFixed(3)} dhue=${(ensureFinite(cur.hue)-ensureFinite(prev.hue)).toFixed(3)} dlife=${(ensureFinite(cur.life)-ensureFinite(prev.life)).toFixed(3)}`);
      }
      if (selectedCp) {
        lines.push(`[checkpoint:${selectedIdx}] x=${ensureFinite(selectedCp.x).toFixed(3)} y=${ensureFinite(selectedCp.y).toFixed(3)} scale=${ensureFinite(selectedCp.scale).toFixed(3)} hue=${ensureFinite(selectedCp.hue).toFixed(3)} life=${ensureFinite(selectedCp.life).toFixed(3)}`);
      }
      ui.entityInspector.textContent = lines.join("\n");
      updatePinnedInspector();
      } finally {
        updateBonusStatus();
      }
    }
    function updateBonusStatus() {
      if (!ui.bonusStatus) return;
      const psel = Number.isFinite(selectedEntityId) ? `#${selectedEntityId}` : "—";
      const cps = ir?.meta?.phase3Checkpoints;
      let cpt = "cp —";
      if (cps && cps.length) {
        const i = Math.min(Math.max(0, Number(ui.checkpointSelect.value) || 0), cps.length - 1);
        cpt = `cp ${i}/${cps.length - 1} ${cps[i]?.label || ""}`;
      }
      const pinc = pinnedEntityIds.size;
      const sxb = ui.abSwapPanes && ui.abSwapPanes.checked;
      const bits = [ `sel ${psel}`, cpt, `pins ${pinc}`, abCompare ? "A/B" : "1-up", sxb ? "swap" : "inline" ];
      if (previewIr) bits.push("preview");
      ui.bonusStatus.textContent = bits.join("  ·  ");
    }
    function updatePinnedInspector() {
      if (!ir) {
        ui.pinnedInspector.textContent = "No IR loaded.";
        return;
      }
      const ids = Array.from(pinnedEntityIds).sort((a, b) => a - b);
      if (!ids.length) {
        ui.pinnedInspector.textContent = "No pinned entities.";
        return;
      }
      const plotKey = ui.plotChannel.value || "hue";
      const cp = Array.isArray(ir.meta?.phase3Checkpoints) ? ir.meta.phase3Checkpoints : [];
      const lines = [];
      lines.push(`Pinned entities (${ids.length}) plot=${plotKey}`);
      for (const id of ids) {
        const cur = getEntityById(ir, id);
        if (!cur) continue;
        const trend = cp.map((c) => {
          const e = getEntityById(c.ir, id);
          return ensureFinite(e ? e[plotKey] : NaN);
        }).filter(Number.isFinite);
        lines.push(`#${id} trend:${sparkline(trend)} cur=${ensureFinite(cur[plotKey]).toFixed(3)} x=${ensureFinite(cur.x).toFixed(1)} y=${ensureFinite(cur.y).toFixed(1)}`);
      }
      ui.pinnedInspector.textContent = lines.join("\n");
    }
    function updatePinGroupUi() {
      ui.pinGroupSelect.innerHTML = "";
      const keys = Array.from(pinGroups.keys()).sort();
      if (!keys.length) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "No groups";
        ui.pinGroupSelect.appendChild(opt);
        refreshPinGroupChips();
        return;
      }
      keys.forEach((k) => {
        const opt = document.createElement("option");
        opt.value = k;
        opt.textContent = `${k} (${pinGroups.get(k).length})`;
        ui.pinGroupSelect.appendChild(opt);
      });
      ui.pinGroupSelect.value = keys[0];
      refreshPinGroupChips();
    }
    function pinGroupColor(idx) {
      const palette = ["#ff7b8b", "#65d6ff", "#aef27c", "#ffd97c", "#c79bff", "#7cf2c7", "#ff9c5a", "#9ad3ff"];
      return palette[idx % palette.length];
    }
    function refreshPinGroupChips() {
      if (!ui.pinGroupChips) return;
      ui.pinGroupChips.innerHTML = "";
      let i = 0;
      for (const [name, ids] of pinGroups) {
        i += 1;
        const visible = pinGroupVisibility.get(name) !== false;
        const chip = document.createElement("span");
        chip.className = "pin-group-chip" + (visible ? "" : " disabled");
        chip.title = `Toggle ${name} (${ids.length})\nShift+click: load into pins\nAlt+click: copy ids`;
        chip.innerHTML = `<span class="swatch" style="background:${pinGroupColor(i - 1)}"></span><b>${escapeHtml(name)}</b><span style="color:var(--muted)">${ids.length}</span>`;
        chip.addEventListener("click", (ev) => {
          if (ev.shiftKey) {
            pinnedEntityIds.clear();
            for (const id of ids) if (Number.isFinite(id)) pinnedEntityIds.add(Math.floor(id));
            persistPinned(true);
            updatePinnedInspector();
            updateLimitsReadout();
            renderCurrent();
            showToast(`Loaded ${ids.length} pins from "${name}".`, "ok");
            return;
          }
          if (ev.altKey) {
            navigator.clipboard.writeText(ids.join(", ")).then(
              () => showToast(`Copied ${ids.length} ids.`, "ok"),
              () => showToast("Clipboard write failed.", "error")
            );
            return;
          }
          pinGroupVisibility.set(name, !visible);
          refreshPinGroupChips();
          renderCurrent();
        });
        ui.pinGroupChips.appendChild(chip);
      }
      if (!pinGroups.size) {
        const span = document.createElement("span");
        span.className = "small";
        span.style.color = "var(--muted)";
        span.textContent = "(no saved groups)";
        ui.pinGroupChips.appendChild(span);
      }
    }
    function overlayTime() {
      return (ui.overlaysFollowTime && ui.overlaysFollowTime.checked) ? stageTime : 0;
    }
    function entityScreenPos(e, t) {
      const tt = t * e.speed + e.phase;
      const px = e.x + Math.sin(tt * e.freqX) * e.ampX + e.vx * t + e.ax * t * t;
      const py = e.y + Math.cos(tt * e.freqY) * e.ampY + e.vy * t + e.ay * t * t;
      return { x: px + STAGE_VIEW_W / 2, y: py + STAGE_VIEW_H / 2 };
    }
    function injectDeltaHeat(currentSvg, baseIr, compareIr, channel, mode) {
      if (!baseIr || !compareIr || !channel || channel === "off") return currentSvg;
      const n = Math.min(baseIr.entities.length, compareIr.entities.length);
      if (!n) return currentSvg;
      const signed = mode === "signed";
      let maxAbsDelta = 0;
      const deltas = new Array(n);
      for (let i = 0; i < n; i += 1) {
        const a = ensureFinite(baseIr.entities[i][channel]);
        const b = ensureFinite(compareIr.entities[i][channel]);
        const raw = a - b;
        const d = signed ? raw : Math.abs(raw);
        deltas[i] = d;
        const abs = Math.abs(d);
        if (abs > maxAbsDelta) maxAbsDelta = abs;
      }
      if (maxAbsDelta <= 0) return currentSvg;
      const t = overlayTime();
      const circles = [];
      for (let i = 0; i < n; i += 1) {
        const e = baseIr.entities[i];
        const pos = entityScreenPos(e, t);
        const intensity = Math.abs(deltas[i]) / maxAbsDelta;
        const rr = 2 + intensity * 9;
        const alpha = Math.min(0.85, 0.12 + intensity * 0.8);
        const hue = signed ? (deltas[i] < 0 ? 220 : 0) : 0;
        circles.push(`<circle cx="${pos.x.toFixed(2)}" cy="${pos.y.toFixed(2)}" r="${rr.toFixed(2)}" fill="hsla(${hue} 100% 56% / ${alpha.toFixed(3)})" />`);
      }
      return currentSvg.replace("</svg>", `<g data-delta-heat="1">${circles.join("")}</g></svg>`);
    }
    function injectDeltaHeatB(currentSvg, baseIr, compareIr, channel, mode) {
      if (!baseIr || !compareIr || !channel || channel === "off") return currentSvg;
      const n = Math.min(baseIr.entities.length, compareIr.entities.length);
      if (!n) return currentSvg;
      const signed = mode === "signed";
      let maxAbsDelta = 0;
      const deltas = new Array(n);
      for (let i = 0; i < n; i += 1) {
        const a = ensureFinite(baseIr.entities[i][channel]);
        const b = ensureFinite(compareIr.entities[i][channel]);
        const raw = a - b;
        const d = signed ? raw : Math.abs(raw);
        deltas[i] = d;
        const abs = Math.abs(d);
        if (abs > maxAbsDelta) maxAbsDelta = abs;
      }
      if (maxAbsDelta <= 0) return currentSvg;
      const t = overlayTime();
      const circles = [];
      for (let i = 0; i < n; i += 1) {
        const e = compareIr.entities[i];
        const pos = entityScreenPos(e, t);
        const intensity = Math.abs(deltas[i]) / maxAbsDelta;
        const rr = 2 + intensity * 9;
        const alpha = Math.min(0.85, 0.12 + intensity * 0.8);
        const hue = signed ? (deltas[i] < 0 ? 220 : 0) : 0;
        circles.push(`<circle cx="${pos.x.toFixed(2)}" cy="${pos.y.toFixed(2)}" r="${rr.toFixed(2)}" fill="hsla(${hue} 100% 56% / ${alpha.toFixed(3)})" />`);
      }
      return currentSvg.replace("</svg>", `<g data-delta-heat-b="1">${circles.join("")}</g></svg>`);
    }
    function injectPinHighlight(currentSvg, baseIr) {
      if (!pinHighlightOn || !baseIr || !pinnedEntityIds.size) return currentSvg;
      const t = overlayTime();
      const showLabels = !!(ui.showPinLabels && ui.showPinLabels.checked);
      const showLines = !!(ui.showConstellation && ui.showConstellation.checked);
      const items = [];
      const pts = [];
      for (const id of pinnedEntityIds) {
        const e = getEntityById(baseIr, id);
        if (!e) continue;
        const pos = entityScreenPos(e, t);
        const rr = 12 + Math.max(0, ensureFinite(e.scale)) * 4;
        items.push(`<circle cx="${pos.x.toFixed(2)}" cy="${pos.y.toFixed(2)}" r="${rr.toFixed(2)}" fill="none" stroke="hsla(55 100% 60% / 0.95)" stroke-width="2.2"/>`);
        if (showLabels) {
          const tx = (pos.x + rr + 4).toFixed(2);
          const ty = (pos.y - rr - 4).toFixed(2);
          items.push(`<text x="${tx}" y="${ty}" fill="hsla(55 100% 70% / 0.95)" font-family="ui-sans-serif,system-ui" font-size="14" font-weight="600">#${id}</text>`);
        }
        const note = entityAnnotations.get(id);
        if (note) {
          const tx = (pos.x + rr + 4).toFixed(2);
          const ty = (pos.y + 14).toFixed(2);
          const safeNote = String(note).slice(0, 80).replace(/[<>&]/g, "");
          items.push(`<text x="${tx}" y="${ty}" fill="hsla(190 100% 80% / 0.95)" font-family="ui-sans-serif,system-ui" font-size="11" font-style="italic">${safeNote}</text>`);
        }
        pts.push(pos);
      }
      let lines = "";
      if (showLines && pts.length >= 2) {
        const segs = [];
        for (let i = 0; i < pts.length; i += 1) {
          for (let j = i + 1; j < pts.length; j += 1) {
            segs.push(`<line x1="${pts[i].x.toFixed(2)}" y1="${pts[i].y.toFixed(2)}" x2="${pts[j].x.toFixed(2)}" y2="${pts[j].y.toFixed(2)}" stroke="hsla(55 100% 60% / 0.45)" stroke-width="0.9" stroke-dasharray="3,3"/>`);
          }
        }
        lines = segs.join("");
      }
      return currentSvg.replace("</svg>", `<g data-pin-highlight="1">${lines}${items.join("")}</g></svg>`);
    }
    function injectJumpFlash(currentSvg, baseIr, eid) {
      if (eid == null || !Number.isFinite(eid) || !baseIr) return currentSvg;
      const e = getEntityById(baseIr, eid);
      if (!e) return currentSvg;
      const t = overlayTime();
      const pos = entityScreenPos(e, t);
      const r = 22 + Math.max(0, ensureFinite(e.scale)) * 5;
      const ring = `<circle cx="${pos.x.toFixed(2)}" cy="${pos.y.toFixed(2)}" r="${r.toFixed(2)}" fill="none" stroke="hsla(190 100% 65% / 0.95)" stroke-width="3"/>`;
      return currentSvg.replace("</svg>", `<g data-jump-flash="1">${ring}</g></svg>`);
    }
    function injectAtlasFilterOverlay(currentSvg, baseIr) {
      if (!baseIr) return currentSvg;
      const dim = !!(ui.atlasFilterDim && ui.atlasFilterDim.checked);
      const matchSet = atlasFilters.size ? new Set(atlasMatchingIds(baseIr)) : null;
      const outlierInfo = atlasOutlierIds(baseIr);
      if (!matchSet && !outlierInfo) return currentSvg;
      const t = overlayTime();
      const parts = [];
      if (matchSet && dim && atlasFilters.size) {
        const dimRects = [];
        for (const e of baseIr.entities) {
          if (matchSet.has(e.id)) continue;
          const pos = entityScreenPos(e, t);
          const rr = 8 + Math.max(0, ensureFinite(e.scale)) * 3;
          dimRects.push(`<circle cx="${pos.x.toFixed(2)}" cy="${pos.y.toFixed(2)}" r="${rr.toFixed(2)}" fill="hsla(220 30% 8% / 0.55)"/>`);
        }
        if (dimRects.length) parts.push(`<g data-atlas-dim="1">${dimRects.join("")}</g>`);
      }
      if (outlierInfo && outlierInfo.ids.length) {
        const rings = [];
        for (const id of outlierInfo.ids) {
          const e = getEntityById(baseIr, id);
          if (!e) continue;
          const pos = entityScreenPos(e, t);
          const rr = 14 + Math.max(0, ensureFinite(e.scale)) * 4;
          rings.push(`<circle cx="${pos.x.toFixed(2)}" cy="${pos.y.toFixed(2)}" r="${rr.toFixed(2)}" fill="none" stroke="hsla(0 90% 65% / 0.95)" stroke-width="2.4" stroke-dasharray="3 4"/>`);
        }
        if (rings.length) parts.push(`<g data-outliers="1">${rings.join("")}</g>`);
      }
      if (!parts.length) return currentSvg;
      return currentSvg.replace("</svg>", `${parts.join("")}</svg>`);
    }
    function injectPinGroupConstellations(currentSvg, baseIr) {
      if (!baseIr || !pinGroups || !pinGroups.size) return currentSvg;
      const t = overlayTime();
      const parts = [];
      let idx = 0;
      for (const [name, ids] of pinGroups) {
        idx += 1;
        if (pinGroupVisibility.has(name) && pinGroupVisibility.get(name) === false) continue;
        const color = pinGroupColor(idx - 1);
        const dots = [];
        const pts = [];
        for (const id of ids) {
          const e = getEntityById(baseIr, id);
          if (!e) continue;
          const pos = entityScreenPos(e, t);
          const rr = 8 + Math.max(0, ensureFinite(e.scale)) * 3;
          dots.push(`<circle cx="${pos.x.toFixed(2)}" cy="${pos.y.toFixed(2)}" r="${rr.toFixed(2)}" fill="none" stroke="${color}" stroke-width="2" stroke-opacity="0.85"/>`);
          pts.push(pos);
        }
        if (!dots.length) continue;
        let lines = "";
        if (pts.length >= 2) {
          const segs = [];
          for (let i = 0; i < pts.length; i += 1) {
            const j = (i + 1) % pts.length;
            segs.push(`<line x1="${pts[i].x.toFixed(2)}" y1="${pts[i].y.toFixed(2)}" x2="${pts[j].x.toFixed(2)}" y2="${pts[j].y.toFixed(2)}" stroke="${color}" stroke-width="0.9" stroke-opacity="0.45"/>`);
          }
          lines = segs.join("");
        }
        let cx = 0, cy = 0;
        for (const p of pts) { cx += p.x; cy += p.y; }
        cx /= pts.length;
        cy /= pts.length;
        const labelBg = `<rect x="${(cx - 6 - name.length * 4).toFixed(2)}" y="${(cy - 18).toFixed(2)}" width="${(name.length * 8 + 12).toFixed(2)}" height="14" rx="3" fill="hsla(220 40% 8% / 0.7)" stroke="${color}" stroke-width="0.8"/>`;
        const label = `<text x="${cx.toFixed(2)}" y="${(cy - 7).toFixed(2)}" font-family="ui-sans-serif,system-ui" font-size="10" text-anchor="middle" fill="${color}">${escapeHtml(name)}</text>`;
        parts.push(`<g data-pin-group="${escapeHtml(name)}">${lines}${dots.join("")}${labelBg}${label}</g>`);
      }
      if (!parts.length) return currentSvg;
      return currentSvg.replace("</svg>", `${parts.join("")}</svg>`);
    }
    function injectStageOverlays(currentSvg, baseIr) {
      if (!baseIr) return currentSvg;
      const showCentroid = !!(ui.overlayCentroid && ui.overlayCentroid.checked);
      const showBbox = !!(ui.overlayBbox && ui.overlayBbox.checked);
      const showGrid = !!(ui.overlayGrid && ui.overlayGrid.checked);
      const showHeat = !!(ui.overlayHeatmap && ui.overlayHeatmap.checked);
      if (!showCentroid && !showBbox && !showGrid && !showHeat) return currentSvg;
      const t = overlayTime();
      const parts = [];
      if (showGrid) {
        const lines = [];
        const step = 100;
        for (let x = 0; x <= STAGE_VIEW_W; x += step) {
          lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${STAGE_VIEW_H}" stroke="hsla(180 30% 60% / 0.18)" stroke-width="${x % 300 === 0 ? 1.2 : 0.6}"/>`);
        }
        for (let y = 0; y <= STAGE_VIEW_H; y += step) {
          lines.push(`<line x1="0" y1="${y}" x2="${STAGE_VIEW_W}" y2="${y}" stroke="hsla(180 30% 60% / 0.18)" stroke-width="${y % 300 === 0 ? 1.2 : 0.6}"/>`);
        }
        parts.push(`<g data-overlay-grid="1">${lines.join("")}</g>`);
      }
      if (showCentroid || showBbox || showHeat) {
        let sx = 0, sy = 0;
        let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
        const positions = [];
        for (const e of baseIr.entities) {
          const p = entityScreenPos(e, t);
          positions.push(p);
          sx += p.x;
          sy += p.y;
          if (p.x < xmin) xmin = p.x;
          if (p.x > xmax) xmax = p.x;
          if (p.y < ymin) ymin = p.y;
          if (p.y > ymax) ymax = p.y;
        }
        const n = positions.length || 1;
        if (showHeat) {
          const cells = 24;
          const cw = STAGE_VIEW_W / cells;
          const ch = STAGE_VIEW_H / cells;
          const grid = Array.from({ length: cells }, () => new Array(cells).fill(0));
          for (const p of positions) {
            const ix = Math.max(0, Math.min(cells - 1, Math.floor(p.x / cw)));
            const iy = Math.max(0, Math.min(cells - 1, Math.floor(p.y / ch)));
            grid[iy][ix] += 1;
          }
          let peak = 0;
          for (let y = 0; y < cells; y += 1) for (let x = 0; x < cells; x += 1) if (grid[y][x] > peak) peak = grid[y][x];
          if (peak > 0) {
            const rects = [];
            for (let y = 0; y < cells; y += 1) {
              for (let x = 0; x < cells; x += 1) {
                const v = grid[y][x];
                if (!v) continue;
                const a = (v / peak) * 0.7;
                rects.push(`<rect x="${(x * cw).toFixed(2)}" y="${(y * ch).toFixed(2)}" width="${cw.toFixed(2)}" height="${ch.toFixed(2)}" fill="hsla(160 70% 55% / ${a.toFixed(3)})"/>`);
              }
            }
            parts.push(`<g data-overlay-heat="1">${rects.join("")}</g>`);
          }
        }
        if (showBbox && Number.isFinite(xmin)) {
          parts.push(`<rect data-overlay-bbox="1" x="${xmin.toFixed(2)}" y="${ymin.toFixed(2)}" width="${(xmax - xmin).toFixed(2)}" height="${(ymax - ymin).toFixed(2)}" fill="none" stroke="hsla(190 90% 65% / 0.7)" stroke-dasharray="6 4" stroke-width="1.4"/>`);
        }
        if (showCentroid) {
          const cx = (sx / n).toFixed(2);
          const cy = (sy / n).toFixed(2);
          parts.push(`<g data-overlay-centroid="1"><circle cx="${cx}" cy="${cy}" r="6" fill="hsla(50 100% 60% / 0.95)" stroke="black" stroke-width="1"/><line x1="${cx}" y1="${(sy / n - 14).toFixed(2)}" x2="${cx}" y2="${(sy / n + 14).toFixed(2)}" stroke="hsla(50 100% 70% / 0.85)" stroke-width="1"/><line x1="${(sx / n - 14).toFixed(2)}" y1="${cy}" x2="${(sx / n + 14).toFixed(2)}" y2="${cy}" stroke="hsla(50 100% 70% / 0.85)" stroke-width="1"/></g>`);
        }
      }
      return currentSvg.replace("</svg>", `${parts.join("")}</svg>`);
    }
    function diffIrBrief(before, after) {
      const channels = before.schema.map((s) => s.name.toLowerCase());
      const out = [];
      out.push(`entities: ${before.entities.length} -> ${after.entities.length}`);
      for (const ch of channels) {
        const b = channelStats(before.entities, ch);
        const a = channelStats(after.entities, ch);
        const dMean = Math.abs(a.mean - b.mean);
        const dSpread = Math.abs((a.max - a.min) - (b.max - b.min));
        if (dMean > 1e-9 || dSpread > 1e-9) {
          out.push(`${ch}: mean ${b.mean.toFixed(3)} -> ${a.mean.toFixed(3)}, spread ${(b.max - b.min).toFixed(3)} -> ${(a.max - a.min).toFixed(3)}`);
        }
      }
      return out.slice(0, 80).join("\n");
    }
    function applyPhase3Pipeline(irState, text) {
      const rawLines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      const lines = [];
      for (const line of rawLines) {
        if (line.startsWith("#")) {
          lines.push(line);
          continue;
        }
        const p = line.split(/\s+/);
        const op = (p[0] || "").toLowerCase();
        if ((op === "macro" || op === "preset") && p.length === 2) {
          lines.push(`# expanded ${op} ${p[1]}`);
          lines.push(...phase3MacroLines(p[1]));
        } else {
          lines.push(line);
        }
      }
      const next = {
        schema: irState.schema.map((s) => ({ ...s })),
        entities: irState.entities.map((e) => ({ ...e })),
        meta: { ...irState.meta, phase3: true }
      };
      const validChannels = new Set(next.schema.map((s) => s.name.toLowerCase()));
      const trace = [];
      const checkpoints = [{ label: "start", ir: snapshotIr(next), durationMs: 0 }];
      for (const line of lines) {
        if (line.startsWith("#")) continue;
        const p = line.split(/\s+/);
        const op = (p[0] || "").toLowerCase();
        const t0 = performance.now();
        if (op === "clamp") {
          if (p.length !== 4) throw new Error(`Malformed clamp: "${line}"`);
          const key = p[1].toLowerCase();
          const minV = Number(p[2]);
          const maxV = Number(p[3]);
          if (!validChannels.has(key)) throw new Error(`Unknown channel in clamp: "${p[1]}"`);
          if (![minV, maxV].every(Number.isFinite) || minV > maxV) throw new Error(`Invalid clamp range in "${line}"`);
          const before = channelStats(next.entities, key);
          passClamp(next.entities, key, minV, maxV);
          const after = channelStats(next.entities, key);
          trace.push(`[clamp ${key}] ${fmtStats(before)} -> ${fmtStats(after)}`);
        } else if (op === "gain") {
          if (p.length !== 3) throw new Error(`Malformed gain: "${line}"`);
          const key = p[1].toLowerCase();
          const factor = Number(p[2]);
          if (!validChannels.has(key) || !Number.isFinite(factor)) throw new Error(`Invalid gain args in "${line}"`);
          const before = channelStats(next.entities, key);
          passGain(next.entities, key, factor);
          const after = channelStats(next.entities, key);
          trace.push(`[gain ${key}] ${fmtStats(before)} -> ${fmtStats(after)}`);
        } else if (op === "bias") {
          if (p.length !== 3) throw new Error(`Malformed bias: "${line}"`);
          const key = p[1].toLowerCase();
          const offset = Number(p[2]);
          if (!validChannels.has(key) || !Number.isFinite(offset)) throw new Error(`Invalid bias args in "${line}"`);
          const before = channelStats(next.entities, key);
          passBias(next.entities, key, offset);
          const after = channelStats(next.entities, key);
          trace.push(`[bias ${key}] ${fmtStats(before)} -> ${fmtStats(after)}`);
        } else if (op === "shuffle") {
          if (p.length !== 2) throw new Error(`Malformed shuffle: "${line}"`);
          const seed = Number(p[1]);
          if (!Number.isFinite(seed)) throw new Error(`Invalid shuffle seed in "${line}"`);
          passShuffle(next.entities, seed);
          trace.push(`[shuffle] seed=${seed}`);
        } else if (op === "sort") {
          if (p.length !== 3) throw new Error(`Malformed sort: "${line}"`);
          const key = p[1].toLowerCase();
          const dir = p[2].toLowerCase();
          if (!validChannels.has(key) || !["asc", "desc"].includes(dir)) throw new Error(`Invalid sort args in "${line}"`);
          const before = channelStats(next.entities, key);
          passSort(next.entities, key, dir);
          const after = channelStats(next.entities, key);
          trace.push(`[sort ${key} ${dir}] ${fmtStats(before)} -> ${fmtStats(after)}`);
        } else if (op === "quantize") {
          if (p.length !== 3) throw new Error(`Malformed quantize: "${line}"`);
          const key = p[1].toLowerCase();
          const steps = Number(p[2]);
          if (!validChannels.has(key) || !Number.isFinite(steps) || steps < 1) throw new Error(`Invalid quantize args in "${line}"`);
          const before = channelStats(next.entities, key);
          let min = Infinity, max = -Infinity;
          for (const e of next.entities) {
            const v = ensureFinite(e[key]);
            if (v < min) min = v;
            if (v > max) max = v;
          }
          if (min !== max) {
            for (const e of next.entities) {
              const t = (ensureFinite(e[key]) - min) / (max - min);
              const q = Math.round(t * steps) / steps;
              e[key] = min + q * (max - min);
            }
          }
          const after = channelStats(next.entities, key);
          trace.push(`[quantize ${key} ${steps}] ${fmtStats(before)} -> ${fmtStats(after)}`);
        } else if (op === "smooth") {
          if (p.length !== 3) throw new Error(`Malformed smooth: "${line}" (smooth channel window)`);
          const key = p[1].toLowerCase();
          const w = Number(p[2]);
          if (!validChannels.has(key) || !Number.isFinite(w) || w < 1 || w > 20) throw new Error(`Invalid smooth args in "${line}"`);
          const before = channelStats(next.entities, key);
          passSmooth(next.entities, key, w);
          const after = channelStats(next.entities, key);
          trace.push(`[smooth ${key} ${w}] ${fmtStats(before)} -> ${fmtStats(after)}`);
        } else if (op === "lerp") {
          if (p.length !== 4) throw new Error(`Malformed lerp: "${line}" (lerp channel target t)`);
          const key = p[1].toLowerCase();
          const target = Number(p[2]);
          const tval = Number(p[3]);
          if (!validChannels.has(key) || !Number.isFinite(target) || !Number.isFinite(tval)) throw new Error(`Invalid lerp args in "${line}"`);
          const before = channelStats(next.entities, key);
          passLerp(next.entities, key, target, tval);
          const after = channelStats(next.entities, key);
          trace.push(`[lerp ${key} -> ${target} t=${tval}] ${fmtStats(before)} -> ${fmtStats(after)}`);
        } else if (op === "prime") {
          // ── prime <subcommand> [args] ────────────────────────────────────
          //   prime evolve <steps>     advance the symplectic flow by <steps>
          //   prime mode H|A           switch dynamics mode (A = no-op here)
          //   prime order 2|4          switch integrator order (Verlet / Yoshida)
          //   prime dt    <h>          set integration step size
          //   prime couple <κ>         set pair-coupling constant (G in H)
          //   prime trap  <η>          set harmonic-trap stiffness (ω² = 4η)
          //   prime soft  <ε>          set Plummer softening length
          //   prime reset              clear velocities + step counter
          //   prime kick <chx> <chy>   stamp velocity field from two channels
          //   prime macro <name>       apply a named, known-good recipe
          //                            (kepler|breather|cluster|harmonic)
          // The shared kernel is verified to match the standalone Phase 4 tool
          // bit-for-bit by .compat_out/phase4_prime_bridge.js. The named
          // macros' diagnostic signatures (which subsystem dominates, what
          // shape the (q_x, p_x) portrait should trace) are verified by
          // .compat_out/phase4_macros_smoke.js.
          if (p.length < 2) throw new Error(`Malformed prime: "${line}" (prime <subcmd> ...)`);
          const sub = (p[1] || "").toLowerCase();
          const meta4 = ensurePrimeMeta(next);
          if (sub === "evolve") {
            if (p.length !== 3) throw new Error(`Malformed prime evolve: "${line}" (prime evolve <steps>)`);
            const steps = Number(p[2]);
            if (!Number.isFinite(steps) || steps < 1 || steps > 10000 || steps !== Math.floor(steps)) {
              throw new Error(`prime evolve: steps must be an integer in 1..10000`);
            }
            const r = passPrimeEvolve(next, steps);
            if (r.skipped) {
              trace.push(`[prime evolve ${steps}] skipped (mode=${r.mode}; only H is implemented in builder)`);
            } else {
              trace.push(`[prime evolve ${steps}] order=${r.order} dt=${r.dt} cum=${r.cumStep} |ΔH/H|=${r.H_drift.toExponential(2)} |ΔL_z|=${r.L_drift.toExponential(2)}`);
            }
          } else if (sub === "mode") {
            if (p.length !== 3) throw new Error(`prime mode: H or A`);
            const m = (p[2] || "").toUpperCase();
            if (m !== "H" && m !== "A") throw new Error(`prime mode: H or A`);
            meta4.params.mode = m;
            trace.push(`[prime mode ${m}]`);
          } else if (sub === "order") {
            if (p.length !== 3) throw new Error(`prime order: 2 or 4`);
            const o = Number(p[2]);
            if (o !== 2 && o !== 4) throw new Error(`prime order: 2 or 4`);
            meta4.params.order = o;
            trace.push(`[prime order ${o}]`);
          } else if (sub === "dt") {
            if (p.length !== 3) throw new Error(`prime dt: <h>`);
            const dt = Number(p[2]);
            if (!Number.isFinite(dt) || dt <= 0 || dt > 0.1) throw new Error(`prime dt: 0 < h ≤ 0.1`);
            meta4.params.dt = dt;
            trace.push(`[prime dt=${dt}]`);
          } else if (sub === "couple") {
            if (p.length !== 3) throw new Error(`prime couple: <κ>`);
            const k = Number(p[2]);
            if (!Number.isFinite(k) || k < 0 || k > 5) throw new Error(`prime couple: 0 ≤ κ ≤ 5`);
            meta4.params.kappa = k;
            trace.push(`[prime couple κ=${k}]`);
          } else if (sub === "trap") {
            if (p.length !== 3) throw new Error(`prime trap: <η>`);
            const eta = Number(p[2]);
            if (!Number.isFinite(eta) || eta < 0 || eta > 5) throw new Error(`prime trap: 0 ≤ η ≤ 5`);
            meta4.params.eta = eta;
            trace.push(`[prime trap η=${eta}]`);
          } else if (sub === "soft") {
            if (p.length !== 3) throw new Error(`prime soft: <ε>`);
            const eps = Number(p[2]);
            if (!Number.isFinite(eps) || eps < 1e-3 || eps > 1) throw new Error(`prime soft: 0.001 ≤ ε ≤ 1`);
            meta4.params.eps = eps;
            trace.push(`[prime soft ε=${eps}]`);
          } else if (sub === "reset") {
            // Wipe velocities and reset cumulative step counter; preserves params.
            for (const ent of next.entities) { ent.vx = 0; ent.vy = 0; }
            meta4.evolveStep = 0;
            trace.push(`[prime reset] velocities cleared, step counter zeroed`);
          } else if (sub === "kick") {
            // Stamp an initial velocity field from two existing channels.
            // Useful when authoring an IR: `prime kick ampX ampY` lifts the
            // amplitudes into the symplectic phase space as initial momenta.
            if (p.length !== 4) throw new Error(`prime kick: <chVx> <chVy>`);
            const kvx = p[2].toLowerCase(), kvy = p[3].toLowerCase();
            if (!validChannels.has(kvx) || !validChannels.has(kvy)) {
              throw new Error(`prime kick: unknown channel(s) "${p[2]}"/"${p[3]}"`);
            }
            for (const ent of next.entities) {
              ent.vx = ensureFinite(ent[kvx]);
              ent.vy = ensureFinite(ent[kvy]);
            }
            trace.push(`[prime kick] vx<-${kvx}, vy<-${kvy}`);
          } else if (sub === "macro") {
            // Apply a named macro: a (params, steps) recipe whose K/V/V_conf
            // signature is documented by PRIME_MACROS and verified by smoke.
            // The macro is *not* a black box — it just sets params and runs
            // an evolve. The recipe is observable via PRIME_MACROS[name].
            if (p.length !== 3) {
              throw new Error(`prime macro: <name> (one of: ${Object.keys(PRIME_MACROS).join("|")})`);
            }
            const macroName = (p[2] || "").toLowerCase();
            const macro = PRIME_MACROS[macroName];
            if (!macro) {
              throw new Error(`unknown prime macro "${p[2]}". try: ${Object.keys(PRIME_MACROS).join("|")}`);
            }
            // Apply parameters (overwrite each named field, leave others alone).
            for (const k of Object.keys(macro.params)) {
              meta4.params[k] = macro.params[k];
            }
            meta4.lastMacro = macroName;
            meta4.lastMacroSig = macro.sig;
            let macroReport = "";
            if (macro.evolve > 0) {
              const r = passPrimeEvolve(next, macro.evolve);
              if (r.skipped) {
                macroReport = ` [evolve skipped: mode=${r.mode}]`;
              } else {
                macroReport = ` evolved=${macro.evolve} cum=${r.cumStep} |ΔH/H|=${r.H_drift.toExponential(2)} |ΔL_z|=${r.L_drift.toExponential(2)}`;
              }
            }
            trace.push(
              `[prime macro ${macroName}] sig="${macro.sig}" `
              + `mode=${macro.params.mode} order=${macro.params.order} `
              + `dt=${macro.params.dt} κ=${macro.params.kappa} `
              + `η=${macro.params.eta} ε=${macro.params.eps}`
              + macroReport
            );
          } else {
            throw new Error(`Unknown prime subcommand "${sub}" in "${line}". Try: evolve|mode|order|dt|couple|trap|soft|reset|kick|macro`);
          }
        } else if (op === "randomize") {
          if (p.length < 4 || p.length > 5) throw new Error(`Malformed randomize: "${line}" (randomize channel lo hi [seed])`);
          const key = p[1].toLowerCase();
          const lo = Number(p[2]);
          const hi = Number(p[3]);
          const seed = p.length === 5 ? Number(p[4]) : 17;
          if (!validChannels.has(key) || !Number.isFinite(lo) || !Number.isFinite(hi) || hi < lo) throw new Error(`Invalid randomize args in "${line}"`);
          passRandomize(next.entities, key, lo, hi, seed);
          const after = channelStats(next.entities, key);
          trace.push(`[randomize ${key} ${lo}..${hi} seed=${seed}] ${fmtStats(after)}`);
        } else if (op === "swirl") {
          if (p.length !== 2) throw new Error(`Malformed swirl: "${line}" (swirl angleDeg)`);
          const angle = Number(p[1]);
          if (!Number.isFinite(angle)) throw new Error(`Invalid swirl angle in "${line}"`);
          passSwirl(next.entities, angle);
          trace.push(`[swirl ${angle}deg]`);
        } else if (op === "abs") {
          if (p.length !== 2) throw new Error(`Malformed abs: "${line}" (abs channel)`);
          const key = p[1].toLowerCase();
          if (!validChannels.has(key)) throw new Error(`Invalid abs channel in "${line}"`);
          const before = channelStats(next.entities, key);
          passAbs(next.entities, key);
          const after = channelStats(next.entities, key);
          trace.push(`[abs ${key}] ${fmtStats(before)} -> ${fmtStats(after)}`);
        } else if (op === "power") {
          if (p.length !== 3) throw new Error(`Malformed power: "${line}" (power channel exponent)`);
          const key = p[1].toLowerCase();
          const exp = Number(p[2]);
          if (!validChannels.has(key) || !Number.isFinite(exp)) throw new Error(`Invalid power args in "${line}"`);
          const before = channelStats(next.entities, key);
          passPower(next.entities, key, exp);
          const after = channelStats(next.entities, key);
          trace.push(`[power ${key} ^${exp}] ${fmtStats(before)} -> ${fmtStats(after)}`);
        } else if (op === "step") {
          if (p.length !== 5) throw new Error(`Malformed step: "${line}" (step channel threshold lo hi)`);
          const key = p[1].toLowerCase();
          const thr = Number(p[2]);
          const lo = Number(p[3]);
          const hi = Number(p[4]);
          if (!validChannels.has(key) || ![thr, lo, hi].every(Number.isFinite)) throw new Error(`Invalid step args in "${line}"`);
          const before = channelStats(next.entities, key);
          passStep(next.entities, key, thr, lo, hi);
          const after = channelStats(next.entities, key);
          trace.push(`[step ${key} <${thr} -> ${lo}/${hi}] ${fmtStats(before)} -> ${fmtStats(after)}`);
        } else if (op === "invert") {
          if (p.length !== 2) throw new Error(`Malformed invert: "${line}" (invert channel)`);
          const key = p[1].toLowerCase();
          if (!validChannels.has(key)) throw new Error(`Invalid invert channel in "${line}"`);
          const before = channelStats(next.entities, key);
          passInvert(next.entities, key);
          const after = channelStats(next.entities, key);
          trace.push(`[invert ${key}] ${fmtStats(before)} -> ${fmtStats(after)}`);
        } else if (op === "normalize") {
          if (p.length !== 4) throw new Error(`Malformed normalize: "${line}" (normalize channel min max)`);
          const key = p[1].toLowerCase();
          const lo = Number(p[2]);
          const hi = Number(p[3]);
          if (!validChannels.has(key) || ![lo, hi].every(Number.isFinite) || hi <= lo) throw new Error(`Invalid normalize args in "${line}"`);
          const before = channelStats(next.entities, key);
          passNormalize(next.entities, key, lo, hi);
          const after = channelStats(next.entities, key);
          trace.push(`[normalize ${key} ${lo}..${hi}] ${fmtStats(before)} -> ${fmtStats(after)}`);
        } else {
          throw new Error(`Unknown phase3 op "${p[0]}"`);
        }
        const elapsed = performance.now() - t0;
        checkpoints.push({ label: line, ir: snapshotIr(next), durationMs: elapsed });
      }
      next.meta.phase3Trace = trace;
      next.meta.phase3Checkpoints = checkpoints;
      return next;
    }
    function syncCheckpointScrubber() {
      if (!ui.checkpointScrub) return;
      const cps = ir?.meta?.phase3Checkpoints;
      if (!cps || !cps.length) {
        ui.checkpointScrub.max = "0";
        ui.checkpointScrub.value = "0";
        ui.checkpointScrub.disabled = true;
        return;
      }
      const last = cps.length - 1;
      ui.checkpointScrub.max = String(last);
      ui.checkpointScrub.disabled = false;
      const cur = Number(ui.checkpointSelect.value);
      const v = Number.isFinite(cur) ? clamp(cur, 0, last) : last;
      ui.checkpointScrub.value = String(v);
    }
    function bumpCheckpoint(delta) {
      const cps = ir?.meta?.phase3Checkpoints;
      if (!cps || !cps.length) return;
      let i = Number(ui.checkpointSelect.value);
      if (!Number.isFinite(i)) i = cps.length - 1;
      i = clamp(i + delta, 0, cps.length - 1);
      ui.checkpointSelect.value = String(i);
      syncCheckpointScrubber();
      if (ui.autoPreviewScrub && ui.autoPreviewScrub.checked) {
        try {
          previewIr = snapshotIr(cps[i].ir);
          renderCurrent();
        } catch (e) { /* ignore */ }
      }
      updateEntityInspector();
    }
    function toggleCheckpointPlayer() {
      if (checkpointPlayer) { stopCheckpointPlayer(); return; }
      const cps = ir?.meta?.phase3Checkpoints;
      if (!cps || cps.length < 2) { showToast("Need at least 2 checkpoints. Add (cp) marks in Phase 3.", "warn"); return; }
      checkpointPlayerDir = (ui.checkpointReverse && ui.checkpointReverse.checked) ? -1 : 1;
      const tick = () => {
        const cur = Number(ui.checkpointSelect.value) || 0;
        let next = cur + checkpointPlayerDir;
        if (next >= cps.length) {
          if (ui.checkpointPingpong && ui.checkpointPingpong.checked) {
            checkpointPlayerDir = -1;
            next = cps.length - 2;
          } else next = 0;
        } else if (next < 0) {
          if (ui.checkpointPingpong && ui.checkpointPingpong.checked) {
            checkpointPlayerDir = 1;
            next = 1;
          } else next = cps.length - 1;
        }
        ui.checkpointSelect.value = String(next);
        syncCheckpointScrubber();
        try {
          previewIr = snapshotIr(cps[next].ir);
          renderCurrent();
        } catch (_e) { /* ignore */ }
        updateEntityInspector();
        const dwell = numInput(ui.checkpointDwell, 80, 5000, 500);
        checkpointPlayer = setTimeout(tick, dwell);
      };
      const dwell = numInput(ui.checkpointDwell, 80, 5000, 500);
      checkpointPlayer = setTimeout(tick, dwell);
      if (ui.btnCheckpointPlay) ui.btnCheckpointPlay.textContent = "■ CP";
      showToast("Checkpoint auto-play started.", "ok");
    }
    function stopCheckpointPlayer() {
      if (checkpointPlayer) { clearTimeout(checkpointPlayer); checkpointPlayer = null; }
      if (ui.btnCheckpointPlay) ui.btnCheckpointPlay.textContent = "▶ CP";
    }
    function updateCheckpointUi() {
      const select = ui.checkpointSelect;
      select.innerHTML = "";
      if (!ir || !Array.isArray(ir.meta?.phase3Checkpoints) || ir.meta.phase3Checkpoints.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "No checkpoints";
        select.appendChild(opt);
        syncCheckpointScrubber();
        updateEntityInspector();
        return;
      }
      ir.meta.phase3Checkpoints.forEach((cp, idx) => {
        const opt = document.createElement("option");
        opt.value = String(idx);
        opt.textContent = `${idx}: ${cp.label}`;
        select.appendChild(opt);
      });
      select.value = String(ir.meta.phase3Checkpoints.length - 1);
      syncCheckpointScrubber();
      updateEntityInspector();
    }

    function shapePath(e) {
      const sid = e.shapeId % 5;
      const seg = Math.max(3, e.segments | 0);
      if (sid === 0) return `<circle cx="0" cy="0" r="${(8 * e.scale).toFixed(2)}"/>`;
      if (sid === 1) return `<rect x="${(-6 * e.scale).toFixed(2)}" y="${(-6 * e.scale).toFixed(2)}" width="${(12 * e.scale).toFixed(2)}" height="${(12 * e.scale).toFixed(2)}" rx="${(e.roundness * 6).toFixed(2)}"/>`;
      if (sid === 2) {
        const points = [];
        for (let i = 0; i < seg; i += 1) {
          const a = (i / seg) * Math.PI * 2;
          const rr = i % 2 ? 8 * e.scale * Math.max(0.2, e.innerRatio) : 8 * e.scale;
          points.push(`${(Math.cos(a) * rr).toFixed(2)},${(Math.sin(a) * rr).toFixed(2)}`);
        }
        return `<polygon points="${points.join(" ")}"/>`;
      }
      if (sid === 3) {
        const p = [];
        for (let i = 0; i <= seg; i += 1) {
          const t = i / seg;
          const x = (t - 0.5) * 30 * e.scale;
          const y = Math.sin(t * Math.PI * 2 + e.phase) * 8 * e.scale;
          p.push(i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : `L ${x.toFixed(2)} ${y.toFixed(2)}`);
        }
        return `<path d="${p.join(" ")}" fill="none"/>`;
      }
      return `<ellipse cx="0" cy="0" rx="${(10 * e.scale * Math.max(0.2, e.aspectX)).toFixed(2)}" ry="${(6 * e.scale * Math.max(0.2, e.aspectY)).toFixed(2)}"/>`;
    }

    function emitSvg(irState, t, animateTag) {
      const width = 1200, height = 900;
      const blendModes = ["normal", "multiply", "screen", "overlay", "lighten", "difference"];
      const body = irState.entities.map((e) => {
        const tt = t * e.speed + e.phase;
        const px = e.x + Math.sin(tt * e.freqX) * e.ampX + e.vx * t + e.ax * t * t;
        const py = e.y + Math.cos(tt * e.freqY) * e.ampY + e.vy * t + e.ay * t * t;
        const rot = e.rot + t * e.rotSpeed;
        const h = wrap360(e.hue + t * 16 * e.glow);
        const a = clamp(e.fillAlpha * (0.2 + e.life * 0.8), 0, 1);
        const strokeA = clamp(e.strokeAlpha, 0, 1);
        const blend = blendModes[e.blendModeId % blendModes.length];
        return [
          `<g data-eid="${e.id}" transform="translate(${(px + width / 2).toFixed(2)} ${(py + height / 2).toFixed(2)}) rotate(${rot.toFixed(2)})" style="mix-blend-mode:${blend}">`,
          `<g fill="hsla(${h.toFixed(2)} ${clamp(e.sat,0,100).toFixed(2)}% ${clamp(e.light,0,100).toFixed(2)}% / ${a.toFixed(3)})"`,
          ` stroke="hsla(${wrap360(h + 40).toFixed(2)} ${clamp(e.sat,0,100).toFixed(2)}% ${clamp(clamp(e.light + 15,0,100),0,100).toFixed(2)}% / ${strokeA.toFixed(3)})"`,
          ` stroke-width="${Math.max(0, e.strokeW).toFixed(2)}"`,
          e.blur > 0 ? ` filter="url(#blur${Math.min(8, Math.round(e.blur))})"` : "",
          `>`,
          shapePath(e),
          `</g>`,
          animateTag ? `<animateTransform attributeName="transform" type="rotate" from="${rot.toFixed(2)}" to="${(rot + e.rotSpeed * 4).toFixed(2)}" dur="${(3 + Math.abs(e.speed)).toFixed(2)}s" repeatCount="indefinite"/>` : "",
          `</g>`
        ].join("");
      }).join("\n");
      const filters = Array.from({ length: 9 }, (_, i) => (
        i === 0 ? "" : `<filter id="blur${i}"><feGaussianBlur stdDeviation="${i * 0.7}"/></filter>`
      )).join("");
      return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
        `<defs>${filters}</defs>`,
        `<rect width="${width}" height="${height}" fill="#080d14"/>`,
        body,
        `</svg>`
      ].join("\n");
    }

    function emitRuntimeHtml(irState) {
      const payload = encodeScriptJson(irState);
      return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>SVG42 Runtime</title><style>
*{box-sizing:border-box}
html,body{margin:0;height:100%;overflow:hidden;background:#0a061a;color:#e6fffb;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
body{
  background:
    radial-gradient(ellipse 70% 38% at 50% 78%,rgba(244,114,182,0.22),transparent 60%),
    radial-gradient(ellipse 60% 60% at 100% -10%,rgba(94,234,212,0.18),transparent 65%),
    radial-gradient(ellipse 50% 60% at 0% 0%,rgba(217,70,239,0.10),transparent 65%),
    linear-gradient(180deg,#0a061a 0%,#120732 55%,#1a0a3d 100%);
}
body::before{content:"";position:fixed;inset:auto 0 0 0;height:38vh;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(244,114,182,0.18) 100%),repeating-linear-gradient(0deg,transparent 0 24px,rgba(244,114,182,0.10) 24px 25px),repeating-linear-gradient(90deg,transparent 0 24px,rgba(94,234,212,0.16) 24px 25px);transform:perspective(420px) rotateX(58deg);transform-origin:50% 100%;mask-image:linear-gradient(180deg,transparent 0%,black 30%,black 100%);-webkit-mask-image:linear-gradient(180deg,transparent 0%,black 30%,black 100%);opacity:0.5;z-index:0}
body::after{content:"";position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 2px,rgba(255,255,255,0.018) 2px 3px);mix-blend-mode:screen;z-index:2}
#v{position:relative;z-index:1;width:100vw;height:100vh;display:block}
.frame-tl,.frame-br{position:fixed;width:24px;height:24px;pointer-events:none;z-index:3}
.frame-tl{top:10px;left:10px;border-top:2px solid #5eead4;border-left:2px solid #5eead4;border-top-left-radius:6px;filter:drop-shadow(0 0 6px rgba(94,234,212,0.55))}
.frame-br{bottom:10px;right:10px;border-bottom:2px solid #f472b6;border-right:2px solid #f472b6;border-bottom-right-radius:6px;filter:drop-shadow(0 0 6px rgba(244,114,182,0.55))}
.badge{position:fixed;top:10px;right:14px;font-size:0.62rem;letter-spacing:0.32em;text-transform:uppercase;color:#5eead4;text-shadow:0 0 6px rgba(94,234,212,0.45);z-index:3;opacity:0.85}
.badge b{color:#f472b6;font-weight:700}
@media (prefers-reduced-motion:reduce){body::before,body::after{animation:none!important}}
@media print{body::before,body::after,.frame-tl,.frame-br,.badge{display:none!important}body{background:#fff!important}}
</style></head>
<body><div class="frame-tl"></div><div class="frame-br"></div><div class="badge">SVG<b>42</b> · runtime</div><div id="v"></div><script>
const state=${payload};
const ENTITY_CAP=${MAX_ENTITIES};
if(!state || !Array.isArray(state.entities) || state.entities.length>ENTITY_CAP){ throw new Error('State invalid or exceeds cap'); }
function wrap360(v){let x=v%360; if(x<0) x+=360; return x;}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
function shapePath(e){
  const sid=e.shapeId%5, seg=Math.max(3,e.segments|0);
  if(sid===0)return '<circle cx="0" cy="0" r="'+(8*e.scale).toFixed(2)+'"/>';
  if(sid===1)return '<rect x="'+(-6*e.scale).toFixed(2)+'" y="'+(-6*e.scale).toFixed(2)+'" width="'+(12*e.scale).toFixed(2)+'" height="'+(12*e.scale).toFixed(2)+'" rx="'+(e.roundness*6).toFixed(2)+'"/>';
  if(sid===2){const pts=[];for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2;const rr=i%2?8*e.scale*Math.max(.2,e.innerRatio):8*e.scale;pts.push((Math.cos(a)*rr).toFixed(2)+','+(Math.sin(a)*rr).toFixed(2));}return '<polygon points="'+pts.join(' ')+'"/>';}
  if(sid===3){const p=[];for(let i=0;i<=seg;i++){const tt=i/seg;const x=(tt-.5)*30*e.scale;const y=Math.sin(tt*Math.PI*2+e.phase)*8*e.scale;p.push((i===0?'M ':'L ')+x.toFixed(2)+' '+y.toFixed(2));}return '<path d="'+p.join(' ')+'" fill="none"/>';}
  return '<ellipse cx="0" cy="0" rx="'+(10*e.scale*Math.max(.2,e.aspectX)).toFixed(2)+'" ry="'+(6*e.scale*Math.max(.2,e.aspectY)).toFixed(2)+'"/>';
}
function frame(ts){
  const t=ts*0.001, w=1200, h=900;
  const bm=['normal','multiply','screen','overlay','lighten','difference'];
  const body=state.entities.slice(0,ENTITY_CAP).map((e)=>{
    const tt=t*e.speed+e.phase;
    const px=e.x+Math.sin(tt*e.freqX)*e.ampX+e.vx*t+e.ax*t*t;
    const py=e.y+Math.cos(tt*e.freqY)*e.ampY+e.vy*t+e.ay*t*t;
    const rot=e.rot+t*e.rotSpeed;
    const hue=wrap360(e.hue+t*16*e.glow);
    const a=clamp(e.fillAlpha*(.2+e.life*.8),0,1);
    return '<g transform="translate('+((px+w/2).toFixed(2))+' '+((py+h/2).toFixed(2))+') rotate('+rot.toFixed(2)+')" style="mix-blend-mode:'+bm[e.blendModeId%bm.length]+'"><g fill="hsla('+hue.toFixed(2)+' '+clamp(e.sat,0,100).toFixed(2)+'% '+clamp(e.light,0,100).toFixed(2)+'% / '+a.toFixed(3)+')" stroke="hsla('+wrap360(hue+40).toFixed(2)+' '+clamp(e.sat,0,100).toFixed(2)+'% '+clamp(e.light+15,0,100).toFixed(2)+'% / '+clamp(e.strokeAlpha,0,1).toFixed(3)+')" stroke-width="'+Math.max(0,e.strokeW).toFixed(2)+'">'+shapePath(e)+'</g></g>';
  }).join('');
  document.getElementById('v').innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" width="100%" height="100%"><defs><linearGradient id="sw-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0a061a"/><stop offset="55%" stop-color="#120732"/><stop offset="100%" stop-color="#1a0a3d"/></linearGradient><radialGradient id="sw-glow" cx="50%" cy="78%" r="60%"><stop offset="0%" stop-color="rgba(244,114,182,0.18)"/><stop offset="100%" stop-color="rgba(244,114,182,0)"/></radialGradient></defs><rect width="'+w+'" height="'+h+'" fill="url(#sw-bg)"/><rect width="'+w+'" height="'+h+'" fill="url(#sw-glow)"/>'+body+'</svg>';
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
<\/script></body></html>`;
    }

    function download(name, data, type) {
      const blob = new Blob([data], { type });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
    }

    function generateRows(count, seed, profile) {
      const rand = mulberry32(seed);
      count = clamp(Math.floor(ensureFinite(count, 120)), 1, MAX_ENTITIES);
      const rows = Array.from({ length: ROW_COUNT }, () => Array(count).fill(0));
      for (let i = 0; i < count; i += 1) {
        const t = i / Math.max(1, count - 1);
        const ang = t * Math.PI * 12 + rand() * Math.PI * 2;
        if (profile === "mandala") {
          rows[0][i] = Math.cos(ang) * (80 + 340 * t);
          rows[1][i] = Math.sin(ang) * (80 + 340 * t);
          rows[3][i] = 0.4 + rand() * 1.6;
          rows[7][i] = i % 3;
          rows[9][i] = 6 + ((i % 10) * 2);
        } else if (profile === "glitch") {
          rows[0][i] = (i % 20) * 48 - 450 + (rand() - 0.5) * 22;
          rows[1][i] = ((i / 20) | 0) * 36 - 320 + (rand() - 0.5) * 20;
          rows[3][i] = 0.2 + rand() * 1.2;
          rows[7][i] = 1 + (i % 2);
          rows[9][i] = 4 + (i % 5);
        } else {
          rows[0][i] = (rand() - 0.5) * 900;
          rows[1][i] = (rand() - 0.5) * 700;
          rows[3][i] = 0.2 + rand() * 1.8;
          rows[7][i] = Math.floor(rand() * 5);
          rows[9][i] = 3 + Math.floor(rand() * 12);
        }
        rows[2][i] = rand() * 2 - 1;
        rows[4][i] = rand() * 360;
        rows[5][i] = (rand() - 0.5) * 160;
        rows[6][i] = (rand() - 0.5) * 160;
        rows[8][i] = Math.floor(rand() * 8);
        rows[10][i] = rand();
        rows[11][i] = rand();
        rows[12][i] = 0.2 + rand() * 2.8;
        rows[13][i] = 0.2 + rand() * 2.8;
        rows[14][i] = rand() * 3;
        rows[15][i] = 0.2 + rand() * 0.8;
        rows[16][i] = 0.15 + rand() * 0.85;
        rows[17][i] = (i * 9 + rand() * 30) % 360;
        rows[18][i] = 45 + rand() * 55;
        rows[19][i] = 35 + rand() * 50;
        rows[20][i] = Math.floor(rand() * 8);
        rows[21][i] = rand() * 2;
        rows[22][i] = rand();
        rows[23][i] = Math.floor(rand() * 6);
        rows[24][i] = rand() * 30;
        rows[25][i] = rand();
        rows[26][i] = rand();
        rows[27][i] = Math.floor(rand() * 4);
        rows[28][i] = rand() * Math.PI * 2;
        rows[29][i] = (rand() - 0.5) * 2.5;
        rows[30][i] = rand() * 120;
        rows[31][i] = rand() * 120;
        rows[32][i] = rand() * 3;
        rows[33][i] = rand() * 3;
        rows[34][i] = (rand() - 0.5) * 180;
        rows[35][i] = (rand() - 0.5) * 2;
        rows[36][i] = (rand() - 0.5) * 2;
        rows[37][i] = (rand() - 0.5) * 0.02;
        rows[38][i] = (rand() - 0.5) * 0.02;
        rows[39][i] = rand() * 2 - 1;
        rows[40][i] = rand() * 2 - 1;
        rows[41][i] = rand();
      }
      return rows.map((row) => row.map((v) => Number(v.toFixed(4))).join(", ")).join("\n");
    }

    function compilePhase2Script(text, seed) {
      if (text.length > MAX_TEXT_CHARS) throw new Error("Phase 2 script too large.");
      const rand = mulberry32((Number(seed) || 42) >>> 0);
      const activeSchema = (Array.isArray(schema) && schema.length === ROW_COUNT) ? schema : parseDsl(DEFAULT_DSL);
      const channelMap = buildChannelMap(activeSchema);
      let entityCount = 120;
      const rows = Array.from({ length: ROW_COUNT }, () => []);
      const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      const directives = [];
      for (const line of lines) {
        if (line.startsWith("#")) continue;
        const p = line.split(/\s+/);
        const op = (p[0] || "").toLowerCase();
        if (op === "entities") {
          const n = Number(p[1]);
          if (!Number.isFinite(n)) throw new Error(`Invalid entities in "${line}"`);
          entityCount = clamp(Math.floor(n), 1, MAX_ENTITIES);
          continue;
        }
        directives.push(p);
      }
      for (let r = 0; r < ROW_COUNT; r += 1) rows[r] = Array(entityCount).fill(0);
      const applyPreset = (name) => {
        const preset = String(name).toLowerCase();
        const refProfile = preset === "nebula" ? "swarm" : (preset === "mandala" ? "mandala" : (preset === "glitch" ? "glitch" : null));
        if (!refProfile) throw new Error(`Unknown preset "${name}"`);
        const generated = generateRows(entityCount, Number(seed) || 42, refProfile).split("\n").slice(0, ROW_COUNT).map(parseNumericRow);
        for (let r = 0; r < ROW_COUNT; r += 1) rows[r] = generated[r];
      };
      const passNormalize = (rowIndex, outMin, outMax) => {
        const arr = rows[rowIndex];
        let min = Infinity, max = -Infinity;
        for (const v of arr) { if (v < min) min = v; if (v > max) max = v; }
        if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return;
        for (let i = 0; i < arr.length; i += 1) {
          const t = (arr[i] - min) / (max - min);
          arr[i] = outMin + t * (outMax - outMin);
        }
      };
      const passQuantize = (rowIndex, steps) => {
        const arr = rows[rowIndex];
        const n = Math.max(1, Math.floor(steps));
        let min = Infinity, max = -Infinity;
        for (const v of arr) { if (v < min) min = v; if (v > max) max = v; }
        if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return;
        for (let i = 0; i < arr.length; i += 1) {
          const t = (arr[i] - min) / (max - min);
          const q = Math.round(t * n) / n;
          arr[i] = min + q * (max - min);
        }
      };
      const passMirror = (rowIndex, center) => {
        const arr = rows[rowIndex];
        for (let i = 0; i < arr.length; i += 1) arr[i] = center - (arr[i] - center);
      };
      for (const p of directives) {
        const op = p[0].toLowerCase();
        if (op === "preset") {
          if (p.length !== 2) throw new Error(`Malformed preset: "${p.join(" ")}"`);
          applyPreset(p[1]);
          continue;
        }
        if (op === "set") {
          if (p.length !== 3) throw new Error(`Malformed set: "${p.join(" ")}"`);
          const row = resolveRowRef(p[1], channelMap);
          const val = Number(p[2]);
          if (!Number.isFinite(row) || row < 0 || row >= ROW_COUNT || !Number.isFinite(val)) throw new Error(`Invalid set args: "${p.join(" ")}"`);
          rows[row].fill(clamp(val, -MAX_CELL_ABS, MAX_CELL_ABS));
        } else if (op === "wave") {
          if (p.length !== 5) throw new Error(`Malformed wave: "${p.join(" ")}"`);
          const row = resolveRowRef(p[1], channelMap);
          const amp = Number(p[2]);
          const freq = Number(p[3]);
          const phase = Number(p[4]);
          if (![row, amp, freq, phase].every(Number.isFinite) || row < 0 || row >= ROW_COUNT) throw new Error(`Invalid wave args: "${p.join(" ")}"`);
          for (let i = 0; i < entityCount; i += 1) rows[row][i] = Math.sin((i / Math.max(1, entityCount - 1)) * Math.PI * 2 * freq + phase) * amp;
        } else if (op === "noise") {
          if (p.length !== 3) throw new Error(`Malformed noise: "${p.join(" ")}"`);
          const row = resolveRowRef(p[1], channelMap);
          const amp = Number(p[2]);
          if (![row, amp].every(Number.isFinite) || row < 0 || row >= ROW_COUNT) throw new Error(`Invalid noise args: "${p.join(" ")}"`);
          for (let i = 0; i < entityCount; i += 1) rows[row][i] += (rand() - 0.5) * amp;
        } else if (op === "normalize") {
          if (p.length !== 4) throw new Error(`Malformed normalize: "${p.join(" ")}"`);
          const row = resolveRowRef(p[1], channelMap);
          const outMin = Number(p[2]);
          const outMax = Number(p[3]);
          if (![row, outMin, outMax].every(Number.isFinite) || outMin > outMax) throw new Error(`Invalid normalize args: "${p.join(" ")}"`);
          passNormalize(row, outMin, outMax);
        } else if (op === "quantize") {
          if (p.length !== 3) throw new Error(`Malformed quantize: "${p.join(" ")}"`);
          const row = resolveRowRef(p[1], channelMap);
          const steps = Number(p[2]);
          if (![row, steps].every(Number.isFinite)) throw new Error(`Invalid quantize args: "${p.join(" ")}"`);
          passQuantize(row, steps);
        } else if (op === "mirror") {
          if (p.length !== 3) throw new Error(`Malformed mirror: "${p.join(" ")}"`);
          const row = resolveRowRef(p[1], channelMap);
          const center = Number(p[2]);
          if (![row, center].every(Number.isFinite)) throw new Error(`Invalid mirror args: "${p.join(" ")}"`);
          passMirror(row, center);
        } else {
          throw new Error(`Unknown phase2 op "${p[0]}"`);
        }
      }
      return rows.map((row) => row.map((v) => Number(clamp(v, -MAX_CELL_ABS, MAX_CELL_ABS).toFixed(4))).join(", ")).join("\n");
    }

    function runSelfCheck() {
      const issues = [];
      if (!Array.isArray(schema) || schema.length !== ROW_COUNT) issues.push("schema-size");
      if (ir && (!Array.isArray(ir.entities) || ir.entities.length > MAX_ENTITIES)) issues.push("entity-cap");
      if (ui.matrixInput.value.length > MAX_TEXT_CHARS) issues.push("matrix-too-large");
      return issues;
    }

    function compileAndReport() {
      try {
        schema = parseDsl(ui.builderDsl.value);
        updatePlotChannelOptions();
        const rows = parseRows(ui.matrixInput.value);
        ir = compileToIR(rows, schema);
        previewIr = null;
        invalidateAtlasCache();
        prunePinnedToIr();
        try { noteIrProvenance(ir); } catch (_) { /* fresh compile clears pill */ }
        // prune scatter selection to current entity ids
        if (scatterSelection && scatterSelection.size) {
          const n = ir.entities.length;
          for (const id of Array.from(scatterSelection)) {
            if (!Number.isFinite(id) || id < 0 || id >= n) scatterSelection.delete(id);
          }
        }
        const issues = runSelfCheck();
        ui.compileStatus.innerHTML = `<span class="ok">Compiled.</span> ${ir.entities.length} entities, ${schema.length} channels.`;
        ui.info.innerHTML = issues.length
          ? `<span class="warn">IR ready with warnings:</span> ${escapeHtml(issues.join(", "))}`
          : `IR ready: entities=${ir.entities.length}, schemaVersion=${ir.meta.schemaVersion}, hardened=true`;
        updateCheckpointUi();
        updateLimitsReadout();
        refreshPageStrap();
        if (typeof refreshPrimeLabDiagnostic === "function") refreshPrimeLabDiagnostic();
      } catch (err) {
        ui.compileStatus.innerHTML = `<span class="danger">Compile failed:</span> ${escapeHtml(err.message)}`;
        ir = null;
        previewIr = null;
        updateCheckpointUi();
        updateLimitsReadout();
        refreshPageStrap();
        if (typeof refreshPrimeLabDiagnostic === "function") refreshPrimeLabDiagnostic();
      }
    }

    function renderCurrent() {
      const renderStart = performance.now();
      const activeIr = previewIr || ir;
      if (!activeIr) {
        ui.info.innerHTML = '<span class="warn">Compile IR first.</span>';
        updateBonusStatus();
        return;
      }
      const renderT = stageTime;
      if (abCompare && previewIr && ir) {
        const cur = ir;
        const ck = previewIr;
        const ch = ui.deltaChannel.value;
        const mode = ui.deltaMode.value;
        const heatOn = ch !== "off";
        const heatB = ui.deltaHeatOnB && ui.deltaHeatOnB.checked && heatOn;
        const swap = ui.abSwapPanes && ui.abSwapPanes.checked;
        const leftDataIr = swap ? ck : cur;
        const rightDataIr = swap ? cur : ck;
        let leftSvg = emitSvg(leftDataIr, renderT, true);
        let rightSvg = emitSvg(rightDataIr, renderT, true);
        leftSvg = injectStageOverlays(leftSvg, leftDataIr);
        rightSvg = injectStageOverlays(rightSvg, rightDataIr);
        leftSvg = injectAtlasFilterOverlay(leftSvg, leftDataIr);
        rightSvg = injectAtlasFilterOverlay(rightSvg, rightDataIr);
        leftSvg = injectPinGroupConstellations(leftSvg, leftDataIr);
        rightSvg = injectPinGroupConstellations(rightSvg, rightDataIr);
        leftSvg = injectPinHighlight(leftSvg, leftDataIr);
        rightSvg = injectPinHighlight(rightSvg, rightDataIr);
        if (heatOn) {
          if (swap) {
            leftSvg = injectDeltaHeatB(leftSvg, cur, ck, ch, mode);
            rightSvg = injectDeltaHeat(rightSvg, cur, ck, ch, mode);
          } else {
            leftSvg = injectDeltaHeat(leftSvg, cur, ck, ch, mode);
            if (heatB) {
              rightSvg = injectDeltaHeatB(rightSvg, cur, ck, ch, mode);
            }
          }
        }
        if (transientJumpId != null) {
          leftSvg = injectJumpFlash(leftSvg, leftDataIr, transientJumpId);
          rightSvg = injectJumpFlash(rightSvg, rightDataIr, transientJumpId);
        }
        lastSvg = leftSvg;
        runtimeHtml = emitRuntimeHtml(cur);
        const aTit = swap ? "A: Selected Checkpoint" : "A: Current IR";
        const bTit = swap ? "B: Current IR" : "B: Selected Checkpoint";
        const hA = !swap && heatOn
          ? ` + δ(${escapeHtml(ch)}, ${escapeHtml(ui.deltaMode.value)}) @current`
          : (swap && heatOn ? ` + δ@checkpoint` : "");
        const hB = !swap && heatB && heatOn
          ? ` + δ@checkpoint pos`
          : (swap && heatOn ? ` + δ@current` : "");
        ui.stage.innerHTML = [
          '<div class="ab-wrap">',
          `<div class="ab-cell"><div class="ab-title">${aTit}${hA}</div>`,
          leftSvg,
          '</div>',
          `<div class="ab-cell"><div class="ab-title">${bTit}${hB}</div>`,
          rightSvg,
          '</div>',
          '</div>'
        ].join("");
      } else {
        lastSvg = emitSvg(activeIr, renderT, true);
        lastSvg = injectStageOverlays(lastSvg, activeIr);
        lastSvg = injectAtlasFilterOverlay(lastSvg, activeIr);
        lastSvg = injectPinGroupConstellations(lastSvg, activeIr);
        lastSvg = injectPinHighlight(lastSvg, activeIr);
        if (transientJumpId != null) lastSvg = injectJumpFlash(lastSvg, activeIr, transientJumpId);
        runtimeHtml = emitRuntimeHtml(activeIr);
        ui.stage.innerHTML = lastSvg;
      }
      applyStageTransform();
      refreshPinToolkit();
      refreshScatterChannelOptions();
      refreshTransferChannels();
      refreshDiffMatrixChannelOptions();
      refreshPhase3Timing();
      markAnalyticsDirty("atlas", "miniMap", "scatter");
      lastRenderMs = performance.now() - renderStart;
      const now = performance.now();
      if (lastFrameMs > 0) {
        const dt = now - lastFrameMs;
        if (dt > 0) {
          const inst = 1000 / dt;
          smoothedFps = smoothedFps ? (smoothedFps * 0.7 + inst * 0.3) : inst;
        }
      }
      lastFrameMs = now;
      refreshStageHud();
      ui.info.innerHTML = previewIr
        ? `<span class="ok">Rendered preview checkpoint.</span> Use "Use Current IR" to exit preview.${abCompare ? " A/B compare is active." : ""}`
        : `<span class="ok">Rendered.</span> Export with the download buttons.`;
      if (abCompare && previewIr && ir && ui.deltaChannel.value !== "off") {
        ui.deltaLegend.innerHTML = ui.deltaMode.value === "signed"
          ? `Legend (${escapeHtml(ui.deltaChannel.value)}): <span style="color:#60a5fa">blue = negative (A-B)</span>, neutral = near 0, <span style="color:#f87171">red = positive (A-B)</span>`
          : `Legend (${escapeHtml(ui.deltaChannel.value)}): red intensity = |A-B|`;
      } else {
        ui.deltaLegend.textContent = "";
      }
      updateEntityInspector();
      updateLimitsReadout();
    }

    document.getElementById("btnBuilderDefault").addEventListener("click", () => {
      ui.builderDsl.value = DEFAULT_DSL;
      ui.dslStatus.innerHTML = `<span class="ok">DSL reset.</span>`;
    });
    document.getElementById("btnApplyDsl").addEventListener("click", () => {
      try {
        schema = parseDsl(ui.builderDsl.value);
        updatePlotChannelOptions();
        ui.dslStatus.innerHTML = `<span class="ok">Compiler built.</span> ${schema.length} channels.`;
      } catch (err) {
        ui.dslStatus.innerHTML = `<span class="danger">DSL error:</span> ${err.message}`;
      }
    });
    document.getElementById("btnGenerate").addEventListener("click", () => {
      const count = numInput(ui.entityCount, 1, MAX_ENTITIES, 120);
      const seed = Number(ui.seed.value) || 42;
      const profile = ui.profile.value;
      ui.matrixInput.value = generateRows(count, seed, profile);
      ui.compileStatus.innerHTML = `<span class="ok">Generated ${count} entities.</span> Press Compile.`;
      updateLimitsReadout();
    });
    document.getElementById("btnPhase2Compile").addEventListener("click", () => {
      try {
        ui.matrixInput.value = compilePhase2Script(ui.phase2Input.value, ui.seed.value);
        previewIr = null;
        ui.compileStatus.innerHTML = `<span class="ok">Phase 2 compiled to matrix.</span> Press Compile.`;
      } catch (err) {
        ui.compileStatus.innerHTML = `<span class="danger">Phase 2 failed:</span> ${escapeHtml(err.message)}`;
      }
    });
    document.getElementById("btnCompile").addEventListener("click", compileAndReport);
    document.getElementById("btnPhase3Apply").addEventListener("click", () => {
      try {
        if (!ir) throw new Error("Compile IR first.");
        ir = applyPhase3Pipeline(ir, ui.phase3Input.value);
        previewIr = null;
        ui.compileStatus.innerHTML = `<span class="ok">Phase 3 passes applied.</span> Entities=${ir.entities.length}.`;
        const cp = Array.isArray(ir.meta.phase3Checkpoints) ? ir.meta.phase3Checkpoints : [];
        const timing = cp.slice(1).map((c, i) => `#${i + 1} ${c.label} :: ${c.durationMs.toFixed(3)}ms`);
        ui.phase3Trace.textContent = [
          ...(ir.meta.phase3Trace || []),
          "",
          "[timing]",
          ...timing
        ].join("\n") || "No pass trace.";
        if (cp.length >= 2) {
          const before = cp[cp.length - 2].ir;
          const after = cp[cp.length - 1].ir;
          ui.phase3Diff.textContent = "[diff last pass]\n" + diffIrBrief(before, after);
        } else {
          ui.phase3Diff.textContent = "";
        }
        updateCheckpointUi();
        updateLimitsReadout();
      } catch (err) {
        ui.compileStatus.innerHTML = `<span class="danger">Phase 3 failed:</span> ${escapeHtml(err.message)}`;
        ui.phase3Trace.textContent = "";
        ui.phase3Diff.textContent = "";
      }
    });
    document.getElementById("btnPhase3Rollback").addEventListener("click", () => {
      try {
        if (!ir) throw new Error("Compile IR first.");
        const cp = Array.isArray(ir.meta?.phase3Checkpoints) ? ir.meta.phase3Checkpoints : [];
        if (cp.length < 2) throw new Error("No checkpoint to roll back.");
        const prev = cp[cp.length - 2];
        ir = snapshotIr(prev.ir);
        previewIr = null;
        ir.meta.phase3Checkpoints = cp.slice(0, -1);
        ir.meta.phase3Trace = (ir.meta.phase3Trace || []).slice(0, -1);
        ui.compileStatus.innerHTML = `<span class="ok">Rolled back.</span> Restored checkpoint: ${prev.label}`;
        ui.phase3Trace.textContent = (ir.meta.phase3Trace || []).join("\n");
        const cp2 = ir.meta.phase3Checkpoints;
        if (cp2.length >= 2) {
          ui.phase3Diff.textContent = "[diff last pass]\n" + diffIrBrief(cp2[cp2.length - 2].ir, cp2[cp2.length - 1].ir);
        } else {
          ui.phase3Diff.textContent = "";
        }
        updateCheckpointUi();
        updateLimitsReadout();
      } catch (err) {
        ui.compileStatus.innerHTML = `<span class="danger">Rollback failed:</span> ${escapeHtml(err.message)}`;
      }
    });
    document.getElementById("btnExportIR").addEventListener("click", () => {
      try {
        if (!ir) throw new Error("Compile IR first.");
        download("svg42_ir.json", JSON.stringify(ir, null, 2), "application/json");
      } catch (err) {
        ui.compileStatus.innerHTML = `<span class="danger">Export failed:</span> ${escapeHtml(err.message)}`;
      }
    });
    document.getElementById("btnImportIR").addEventListener("click", async () => {
      try {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json";
        input.click();
        const file = await new Promise((resolve, reject) => {
          input.onchange = () => input.files && input.files[0] ? resolve(input.files[0]) : reject(new Error("No file selected."));
          input.onerror = () => reject(new Error("File dialog failed."));
        });
        const text = await file.text();
        if (text.length > MAX_TEXT_CHARS) throw new Error("IR JSON too large.");
        const candidate = JSON.parse(text);
        validateIrShape(candidate);
        ir = candidate;
        schema = candidate.schema;
        previewIr = null;
        prunePinnedToIr();
        try { noteIrProvenance(candidate); } catch (_) { /* provenance pill is best-effort */ }
        ui.compileStatus.innerHTML = `<span class="ok">IR imported.</span> Entities=${ir.entities.length}.`;
        ui.phase3Trace.textContent = Array.isArray(ir.meta?.phase3Trace) ? ir.meta.phase3Trace.join("\n") : "";
        ui.phase3Diff.textContent = "";
        updateCheckpointUi();
        updateLimitsReadout();
      } catch (err) {
        ui.compileStatus.innerHTML = `<span class="danger">Import failed:</span> ${escapeHtml(err.message)}`;
      }
    });
    document.getElementById("btnPreviewCheckpoint").addEventListener("click", () => {
      try {
        if (!ir) throw new Error("Compile IR first.");
        const cp = Array.isArray(ir.meta?.phase3Checkpoints) ? ir.meta.phase3Checkpoints : [];
        if (!cp.length) throw new Error("No checkpoints.");
        const idx = Number(ui.checkpointSelect.value);
        if (!Number.isFinite(idx) || idx < 0 || idx >= cp.length) throw new Error("Invalid checkpoint index.");
        previewIr = snapshotIr(cp[idx].ir);
        renderCurrent();
        updateEntityInspector();
      } catch (err) {
        ui.compileStatus.innerHTML = `<span class="danger">Preview failed:</span> ${escapeHtml(err.message)}`;
      }
    });
    document.getElementById("btnClearPreview").addEventListener("click", () => {
      previewIr = null;
      renderCurrent();
      updateEntityInspector();
    });
    document.getElementById("btnToggleAB").addEventListener("click", (ev) => {
      abCompare = !abCompare;
      ev.target.textContent = `A/B Compare: ${abCompare ? "On" : "Off"}`;
      renderCurrent();
    });
    ui.deltaChannel.addEventListener("change", () => {
      renderCurrent();
    });
    ui.deltaMode.addEventListener("change", () => {
      renderCurrent();
    });
    ui.plotChannel.addEventListener("change", () => {
      updateEntityInspector();
    });
    document.getElementById("btnPinEntity").addEventListener("click", () => {
      if (!Number.isFinite(selectedEntityId)) return;
      pinnedEntityIds.add(Math.floor(selectedEntityId));
      updatePinnedInspector();
      persistPinned(true);
      updateLimitsReadout();
      renderCurrent();
    });
    document.getElementById("btnClearPins").addEventListener("click", () => {
      pinnedEntityIds.clear();
      updatePinnedInspector();
      persistPinned(true);
      updateLimitsReadout();
      renderCurrent();
    });
    document.getElementById("btnSavePinGroup").addEventListener("click", () => {
      const name = normalizePinGroupName(ui.pinGroupName.value);
      if (!name) {
        pinGroupsSetStatus("name: A-Z, 0-9, _, -, space, max 48 chars", false);
        return;
      }
      if (pinGroups.size >= MAX_PIN_GROUP_COUNT && !pinGroups.has(name)) {
        pinGroupsSetStatus(`max ${MAX_PIN_GROUP_COUNT} groups; delete one first`, false);
        return;
      }
      const list = normalizePinIdList(Array.from(pinnedEntityIds));
      if (!list.length) {
        pinGroupsSetStatus("no valid pins to save", false);
        return;
      }
      pinGroups.set(name, list);
      updatePinGroupUi();
      persistPinGroups(true);
      updateLimitsReadout();
    });
    document.getElementById("btnLoadPinGroup").addEventListener("click", () => {
      const name = ui.pinGroupSelect.value;
      if (!pinGroups.has(name)) return;
      pinnedEntityIds.clear();
      for (const id of pinGroups.get(name)) pinnedEntityIds.add(id);
      updatePinnedInspector();
      persistPinned(true);
      updateLimitsReadout();
      renderCurrent();
    });
    document.getElementById("btnDeletePinGroup").addEventListener("click", () => {
      const name = ui.pinGroupSelect.value;
      if (!pinGroups.has(name)) return;
      pinGroups.delete(name);
      updatePinGroupUi();
      persistPinGroups(true);
      updateLimitsReadout();
    });
    document.getElementById("btnExportPinGroups").addEventListener("click", () => {
      if (!pinGroups.size) {
        pinGroupsSetStatus("nothing to export", false);
        return;
      }
      download("svg42_pin_groups.json", pinGroupsToJsonPayload(), "application/json");
      pinGroupsSetStatus("downloaded JSON (portable backup).", true);
    });
    (function initPinGroupImport() {
      const pinFile = document.getElementById("pinGroupImportFile");
      document.getElementById("btnImportPinGroups").addEventListener("click", () => {
        pinFile.value = "";
        pinFile.click();
      });
      pinFile.addEventListener("change", () => {
        const f = pinFile.files && pinFile.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          try {
            const p = JSON.parse(String(r.result || ""));
            const res = importPinGroupsPayload(p, ui.pinGroupImportReplace.checked);
            if (res.ok) {
              updatePinGroupUi();
              persistPinGroups(true);
              pinGroupsSetStatus(res.msg, true);
              updateLimitsReadout();
            } else {
              pinGroupsSetStatus(res.msg, false);
            }
          } catch (e) {
            pinGroupsSetStatus(e.message || "JSON error", false);
          }
          pinFile.value = "";
        };
        r.onerror = () => {
          pinGroupsSetStatus("file read failed", false);
          pinFile.value = "";
        };
        r.readAsText(f);
      });
    }());
    document.getElementById("btnClearPinStorage").addEventListener("click", () => {
      const had = safeLocalGet(LS_PIN_GROUPS_KEY) || safeLocalGet(LS_PINS_KEY) || pinGroups.size || pinnedEntityIds.size;
      clearAllPinData();
      updatePinGroupUi();
      updatePinnedInspector();
      renderCurrent();
      if (had) pinGroupsSetStatus("cleared groups, pins, and local storage.", true);
      else pinGroupsSetStatus("already empty.", true);
      updateLimitsReadout();
    });
    if (ui.btnPinGroupShowAll) ui.btnPinGroupShowAll.addEventListener("click", () => {
      if (!pinGroups.size) { showToast("No groups saved.", "warn"); return; }
      for (const name of pinGroups.keys()) pinGroupVisibility.set(name, true);
      refreshPinGroupChips();
      renderCurrent();
    });
    if (ui.btnPinGroupHideAll) ui.btnPinGroupHideAll.addEventListener("click", () => {
      if (!pinGroups.size) { showToast("No groups saved.", "warn"); return; }
      for (const name of pinGroups.keys()) pinGroupVisibility.set(name, false);
      refreshPinGroupChips();
      renderCurrent();
    });
    document.getElementById("btnTogglePinHighlight").addEventListener("click", (ev) => {
      pinHighlightOn = !pinHighlightOn;
      ev.target.textContent = `Pin Highlight: ${pinHighlightOn ? "On" : "Off"}`;
      renderCurrent();
    });
    ui.checkpointSelect.addEventListener("change", () => {
      syncCheckpointScrubber();
      updateEntityInspector();
    });
    document.getElementById("btnCheckpointPrev").addEventListener("click", () => {
      bumpCheckpoint(-1);
    });
    document.getElementById("btnCheckpointNext").addEventListener("click", () => {
      bumpCheckpoint(1);
    });
    if (ui.btnCheckpointPlay) ui.btnCheckpointPlay.addEventListener("click", toggleCheckpointPlayer);
    ui.stage.addEventListener("click", (ev) => {
      const target = ev.target && ev.target.closest ? ev.target.closest("[data-eid]") : null;
      if (!target) return;
      const eid = Math.floor(Number(target.getAttribute("data-eid")));
      if (!Number.isFinite(eid)) return;
      selectedEntityId = eid;
      if (ev.shiftKey) {
        pinnedEntityIds.add(eid);
        persistPinned(true);
        updateLimitsReadout();
      }
      updateEntityInspector();
      if (ev.shiftKey) renderCurrent();
    });
    document.getElementById("btnRender").addEventListener("click", renderCurrent);
    document.getElementById("btnDownloadSvg").addEventListener("click", () => {
      if (!lastSvg && ir) lastSvg = emitSvg(ir, 0, true);
      if (!lastSvg) return;
      download("svg42_scene.svg", lastSvg, "image/svg+xml");
    });
    document.getElementById("btnDownloadHtml").addEventListener("click", () => {
      if (!runtimeHtml && ir) runtimeHtml = emitRuntimeHtml(ir);
      if (!runtimeHtml) return;
      download("svg42_runtime.html", runtimeHtml, "text/html");
    });
    document.getElementById("btnExportBundle").addEventListener("click", () => {
      try {
        if (!ir) throw new Error("Compile IR first.");
        const bundle = buildSessionBundle();
        const text = JSON.stringify(bundle, null, 2);
        if (text.length > 8 * 1024 * 1024) throw new Error("Bundle over 8MB; export pieces separately.");
        download("svg42_session_bundle.json", text, "application/json");
        ui.compileStatus.innerHTML = "<span class=\"ok\">Session bundle downloaded.</span>";
        updateLimitsReadout();
      } catch (err) {
        ui.compileStatus.innerHTML = `<span class="danger">Bundle export failed:</span> ${escapeHtml(err.message)}`;
      }
    });
    document.getElementById("btnImportBundle").addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,application/json";
      input.addEventListener("change", () => {
        const f = input.files && input.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          try {
            const raw = String(r.result || "");
            if (raw.length > 12 * 1024 * 1024) throw new Error("Bundle file too large.");
            applySessionBundle(JSON.parse(raw));
          } catch (e) {
            ui.compileStatus.innerHTML = `<span class="danger">Bundle import failed:</span> ${escapeHtml(e.message || String(e))}`;
          }
        };
        r.onerror = () => {
          ui.compileStatus.innerHTML = "<span class=\"danger\">Bundle import failed: could not read file.</span>";
        };
        r.readAsText(f);
      });
      input.click();
    });
    document.getElementById("btnSelfCheck").addEventListener("click", () => {
      const issues = runSelfCheck();
      if (issues.length) {
        ui.compileStatus.innerHTML = `<span class="warn">Self-check:</span> ${escapeHtml(issues.join(", "))}`;
      } else {
        ui.compileStatus.innerHTML = "<span class=\"ok\">Self-check: clean (limits + schema + entity cap).</span>";
      }
    });
    document.getElementById("btnCopyInspector").addEventListener("click", () => {
      const t = ui.entityInspector.textContent;
      if (t) {
        navigator.clipboard.writeText(t).then(
          () => { ui.compileStatus.innerHTML = "<span class=\"ok\">Inspector text copied.</span>"; },
          () => { ui.compileStatus.innerHTML = "<span class=\"danger\">Clipboard failed.</span>"; }
        );
      }
    });
    document.getElementById("btnCopyPinned").addEventListener("click", () => {
      const t = ui.pinnedInspector.textContent;
      if (t) {
        navigator.clipboard.writeText(t).then(
          () => { ui.compileStatus.innerHTML = "<span class=\"ok\">Pins panel copied.</span>"; },
          () => { ui.compileStatus.innerHTML = "<span class=\"danger\">Clipboard failed.</span>"; }
        );
      }
    });
    if (ui.checkpointScrub) {
      ui.checkpointScrub.addEventListener("input", () => {
        const cps = ir?.meta?.phase3Checkpoints;
        if (!cps || !cps.length) return;
        const i = clamp(Math.floor(Number(ui.checkpointScrub.value) || 0), 0, cps.length - 1);
        ui.checkpointSelect.value = String(i);
        if (ui.autoPreviewScrub && ui.autoPreviewScrub.checked) {
          try {
            previewIr = snapshotIr(cps[i].ir);
            renderCurrent();
          } catch (e) { /* ignore */ }
        } else {
          updateEntityInspector();
        }
      });
    }
    if (ui.abSwapPanes) {
      ui.abSwapPanes.addEventListener("change", () => {
        updateBonusStatus();
        renderCurrent();
      });
    }
    document.getElementById("btnEntityJump").addEventListener("click", doEntityJump);
    document.getElementById("btnRandomEntity").addEventListener("click", pickRandomEntity);
    document.getElementById("btnStageFullscreen").addEventListener("click", () => {
      const st = document.getElementById("stage");
      if (!document.fullscreenElement) {
        st.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
    ui.entityJumpId.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        doEntityJump();
      }
    });
    document.getElementById("btnExportPins").addEventListener("click", () => {
      const list = Array.from(pinnedEntityIds).sort((a, b) => a - b);
      if (!list.length) {
        pinGroupsSetStatus("no pins to export", false);
        return;
      }
      download("svg42_pins.json", JSON.stringify({ v: 1, kind: "svg42_pins", pinned: list, exportedAt: new Date().toISOString() }, null, 2), "application/json");
      pinGroupsSetStatus("pins JSON downloaded.", true);
    });
    document.getElementById("btnUpdatePinGroup").addEventListener("click", () => {
      const name = ui.pinGroupSelect.value;
      if (!name || !pinGroups.has(name)) {
        pinGroupsSetStatus("select a group", false);
        return;
      }
      const list = normalizePinIdList(Array.from(pinnedEntityIds));
      if (!list.length) {
        pinGroupsSetStatus("no current pins to write", false);
        return;
      }
      pinGroups.set(name, list);
      updatePinGroupUi();
      ui.pinGroupSelect.value = name;
      persistPinGroups(true);
      updateLimitsReadout();
      pinGroupsSetStatus(`updated "${name}".`, true);
    });
    document.getElementById("btnDuplicatePinGroup").addEventListener("click", () => {
      const from = ui.pinGroupSelect.value;
      const to = normalizePinGroupName(ui.pinGroupName.value);
      if (!from || !pinGroups.has(from)) {
        pinGroupsSetStatus("select a source group", false);
        return;
      }
      if (!to) {
        pinGroupsSetStatus("enter new name in Pin Group field", false);
        return;
      }
      if (to !== from && pinGroups.has(to)) {
        pinGroupsSetStatus("target name already exists", false);
        return;
      }
      pinGroups.set(to, pinGroups.get(from).slice());
      updatePinGroupUi();
      ui.pinGroupSelect.value = to;
      ui.pinGroupName.value = to;
      persistPinGroups(true);
      updateLimitsReadout();
      pinGroupsSetStatus(`duplicated to "${to}".`, true);
    });
    document.getElementById("btnRenamePinGroup").addEventListener("click", () => {
      const from = ui.pinGroupSelect.value;
      const to = normalizePinGroupName(ui.pinGroupName.value);
      if (!from || !pinGroups.has(from)) {
        pinGroupsSetStatus("select a group to rename", false);
        return;
      }
      if (!to) {
        pinGroupsSetStatus("enter new name", false);
        return;
      }
      if (from === to) {
        pinGroupsSetStatus("name unchanged", false);
        return;
      }
      if (pinGroups.has(to)) {
        pinGroupsSetStatus("new name already in use", false);
        return;
      }
      const ids = pinGroups.get(from);
      pinGroups.delete(from);
      pinGroups.set(to, ids);
      updatePinGroupUi();
      ui.pinGroupSelect.value = to;
      ui.pinGroupName.value = to;
      persistPinGroups(true);
      updateLimitsReadout();
      pinGroupsSetStatus(`renamed to "${to}".`, true);
    });
    if (ui.deltaHeatOnB) {
      ui.deltaHeatOnB.addEventListener("change", () => {
        renderCurrent();
      });
    }
    document.addEventListener("keydown", (ev) => {
      if (isTypingContext(document.activeElement)) return;
      if (ev.key === "Escape" && transientJumpId != null) {
        ev.preventDefault();
        if (jumpFlashTimer) clearTimeout(jumpFlashTimer);
        jumpFlashTimer = null;
        transientJumpId = null;
        renderCurrent();
        return;
      }
      if (ev.key.length === 1 && ev.key.toLowerCase() === "g" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
        ev.preventDefault();
        ui.entityJumpId.focus();
        ui.entityJumpId.select();
        return;
      }
      if (ev.key.length === 1 && ev.key.toLowerCase() === "c" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
        ev.preventDefault();
        const t = ui.entityInspector.textContent;
        if (t) navigator.clipboard.writeText(t).catch(() => {});
        return;
      }
      if (ev.key.length === 1 && ev.key.toLowerCase() === "r" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
        ev.preventDefault();
        pickRandomEntity();
        return;
      }
      if (ev.key === "ArrowLeft" || ev.key === ",") {
        ev.preventDefault();
        bumpEntity(-1);
        return;
      }
      if (ev.key === "ArrowRight" || ev.key === ".") {
        ev.preventDefault();
        bumpEntity(1);
        return;
      }
      if (ev.key === "j" || ev.key === "]") {
        ev.preventDefault();
        bumpCheckpoint(1);
        return;
      }
      if (ev.key === "k" || ev.key === "[") {
        ev.preventDefault();
        bumpCheckpoint(-1);
        return;
      }
      if (ev.key.length !== 1 || ev.key.toLowerCase() !== "p") return;
      ev.preventDefault();
      if (!ir) return;
      if (!Number.isFinite(selectedEntityId)) return;
      if (ev.shiftKey) {
        pinnedEntityIds.delete(Math.floor(selectedEntityId));
      } else {
        pinnedEntityIds.add(Math.floor(selectedEntityId));
      }
      updatePinnedInspector();
      persistPinned(true);
      updateLimitsReadout();
      renderCurrent();
    });

    function showToast(msg, kind) {
      if (!ui.toast) return;
      ui.toast.textContent = msg;
      ui.toast.classList.add("show");
      ui.toast.style.borderColor = kind === "error" ? "var(--danger)" : (kind === "warn" ? "var(--warn)" : "var(--line)");
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { ui.toast.classList.remove("show"); }, 2400);
    }
    function applyTheme(name) {
      const valid = ["default", "midnight", "lab", "synthwave"];
      const next = valid.includes(name) ? name : "synthwave";
      if (next === "default") {
        document.body.removeAttribute("data-theme");
      } else {
        document.body.setAttribute("data-theme", next);
      }
      safeLocalSet(LS_THEME_KEY, next);
      if (ui.themeSelect && ui.themeSelect.value !== next) ui.themeSelect.value = next;
    }
    function loadStoredTheme() {
      const t = safeLocalGet(LS_THEME_KEY);
      applyTheme(t || "synthwave");
    }
    // ---------- page navigation ----------
    const LS_PAGE_KEY = "svg42:page";
    const PAGE_LIST = ["build", "stage", "inspect", "analyze", "lab", "all"];
    const PAGE_HOTKEYS = { "1": "build", "2": "stage", "3": "inspect", "4": "analyze", "5": "lab", "0": "all" };
    let activePage = "build";
    const PAGE_TAGS = {
      build:   { title: "build",   tag: "compile.",    meta: "DSL · matrix · phase 2 · phase 3" },
      stage:   { title: "stage",   tag: "render.",     meta: "output · mini-map · frame strip" },
      inspect: { title: "inspect", tag: "interrogate.", meta: "entities · pins · search · snapshots" },
      analyze: { title: "analyze", tag: "measure.",    meta: "atlas · scatter · diffs · correlation" },
      lab:     { title: "lab",     tag: "experiment.", meta: "phase labs · palette · transfer · macros" },
      all:     { title: "all",     tag: "everything.", meta: "every panel revealed" },
    };
    // dedupe strap writes to avoid layout thrash when called frequently
    const _strapCache = { title: "", tag: "", meta: "", count: "" };
    function refreshPageStrap() {
      try {
        const name = activePage || "build";
        const strap = PAGE_TAGS[name] || PAGE_TAGS.build;
        const sTitle = document.getElementById("pageStrapTitle");
        const sTag = document.getElementById("pageStrapTag");
        const sMeta = document.getElementById("pageStrapMeta");
        const counter = document.getElementById("pageCount");
        if (sTitle && _strapCache.title !== strap.title) {
          sTitle.textContent = strap.title; _strapCache.title = strap.title;
        }
        if (sTag && _strapCache.tag !== strap.tag) {
          sTag.textContent = strap.tag; _strapCache.tag = strap.tag;
        }
        const visible = document.querySelectorAll(`.grid > section[data-page~="${name}"]`).length;
        const total = document.querySelectorAll(".grid > section[data-page]").length;
        const entCount = (typeof ir === "object" && ir && ir.entities) ? ir.entities.length : 0;
        const chCount = (typeof ir === "object" && ir && ir.schema) ? ir.schema.length : 0;
        let hashStr = "------";
        try {
          if (ir) hashStr = (irStructHash(ir) >>> 0).toString(16).padStart(6, "0").slice(-6);
        } catch (_e) { /* noop */ }
        const metaText = `${strap.meta} · ${entCount}e × ${chCount}c · #${hashStr} · ${visible}/${total}`;
        if (sMeta && _strapCache.meta !== metaText) {
          sMeta.textContent = metaText; _strapCache.meta = metaText;
        }
        const countText = `${visible}/${total} panels`;
        if (counter && _strapCache.count !== countText) {
          counter.textContent = countText; _strapCache.count = countText;
        }
      } catch (e) {
        try { console.error("[svg42:refreshPageStrap]", e); } catch (_e) { /* noop */ }
      }
    }
    function navigatePage(delta) {
      if (!Array.isArray(PAGE_LIST) || !PAGE_LIST.length) return;
      const cur = PAGE_LIST.indexOf(activePage);
      const idx = cur < 0 ? 0 : cur;
      const nextIdx = (idx + delta + PAGE_LIST.length) % PAGE_LIST.length;
      setActivePage(PAGE_LIST[nextIdx], true);
    }
    function setActivePage(name, persist) {
      const next = PAGE_LIST.includes(name) ? name : "build";
      activePage = next;
      document.body.setAttribute("data-page", next);
      const tabs = document.querySelectorAll("#pagenav .tab");
      tabs.forEach((t) => {
        const on = t.getAttribute("data-page-target") === next;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        if (on) t.setAttribute("aria-current", "page");
        else t.removeAttribute("aria-current");
      });
      refreshPageStrap();
      if (persist !== false) safeLocalSet(LS_PAGE_KEY, next);
      // some panels skip refresh while hidden; nudge them now that they're visible
      markAnalyticsDirty("atlas", "miniMap", "scatter", "diffMatrix", "frameStrip", "transferCanvas", "paletteSwatches");
    }
    function loadStoredPage() {
      const stored = safeLocalGet(LS_PAGE_KEY);
      setActivePage(stored || "build", false);
    }

    // ---- Offline-ready indicator ------------------------------------------
    // The whole tool is self-contained; this pill simply reflects the device's
    // network state so the user knows airplane mode won't break anything.
    let _netLastState = null;
    function refreshNetIndicator(forceLog) {
      const el = document.getElementById("pageStrapNet");
      if (!el) return;
      const online = (typeof navigator === "undefined" || navigator.onLine !== false);
      const next = online ? "online" : "offline";
      if (next === _netLastState && !forceLog) return;
      _netLastState = next;
      el.setAttribute("data-state", next);
      const label = el.querySelector(".ps-net-label");
      if (label) label.textContent = online ? "offline-ready" : "offline";
      el.title = online
        ? "Network is reachable, but this app runs entirely offline; no requests are made."
        : "Network is unreachable, but this app runs entirely offline. Carry on.";
      try { console.info("[svg42][offline] state=" + next + " (app is fully self-contained)"); } catch (_) {}
    }
    function initNetIndicator() {
      try {
        refreshNetIndicator(true);
        if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
          window.addEventListener("online",  () => refreshNetIndicator(false));
          window.addEventListener("offline", () => refreshNetIndicator(false));
        }
      } catch (_) { /* swallow */ }
    }

    // ---- IR provenance pill ----------------------------------------------
    // Surfaces a small dismissable pill in the page strap when an imported
    // IR carries provenance metadata (currently: Phase 4 PRIME recurrence).
    // Defensive: bad/unknown shapes silently no-op rather than throw, so an
    // import path is never made fragile by the audit code.
    function _setProvenancePill(state) {
      const el = ui.pageStrapProv || document.getElementById("pageStrapProv");
      if (!el) return;
      if (!state) {
        el.setAttribute("data-open", "false");
        el.removeAttribute("title");
        return;
      }
      const labelEl = ui.pageStrapProvLabel || el.querySelector(".ps-prov-label");
      if (labelEl) labelEl.textContent = state.label || "provenance";
      if (state.title) el.setAttribute("title", state.title); else el.removeAttribute("title");
      el.setAttribute("data-open", "true");
    }
    function noteIrProvenance(candidate) {
      try {
        const meta = candidate && typeof candidate === "object" ? candidate.meta : null;
        if (!meta || typeof meta !== "object") { _setProvenancePill(null); return; }
        const p4 = meta.phase4;
        if (p4 && typeof p4 === "object" && p4.source === "prime-evolution") {
          const step = Number.isFinite(p4.step) ? Number(p4.step) | 0 : null;
          const params = p4.params && typeof p4.params === "object" ? p4.params : {};
          const tag =
            "Imported from Phase 4 (PRIME recursive coupled recurrence)"
            + (step != null ? " at step " + step : "")
            + (Number.isFinite(params.eta) && Number.isFinite(params.gamma) && Number.isFinite(params.kappa)
                ? " · η=" + Number(params.eta).toFixed(3)
                  + " γ=" + Number(params.gamma).toFixed(3)
                  + " κ=" + Number(params.kappa).toFixed(3)
                : "")
            + " · click × to dismiss";
          _setProvenancePill({
            label: step != null ? ("phase 4 · step " + step) : "phase 4",
            title: tag,
          });
          try { console.info("[svg42][provenance] " + tag); } catch (_) {}
          return;
        }
        _setProvenancePill(null);
      } catch (_) {
        _setProvenancePill(null);
      }
    }
    function initProvenancePill() {
      try {
        const x = ui.pageStrapProvDismiss || document.getElementById("pageStrapProvDismiss");
        if (x && typeof x.addEventListener === "function") {
          x.addEventListener("click", () => _setProvenancePill(null));
        }
      } catch (_) { /* swallow */ }
    }

    // ---- Offline self-attestation -----------------------------------------
    // Walks the live document looking for any element that would hit the network
    // (link/script/img/iframe/audio/video/source/object/embed/form action).
    // Reports the count and any offending URLs in the console; the result is
    // surfaced in fortifySelfTest below.
    function auditExternalRefs() {
      const offenders = [];
      const isExternal = (u) => {
        if (!u) return false;
        const s = String(u).trim();
        if (!s) return false;
        const lower = s.toLowerCase();
        if (lower.startsWith("data:") || lower.startsWith("blob:") || lower.startsWith("javascript:")) return false;
        if (lower.startsWith("#") || lower.startsWith("./") || lower.startsWith("/") || lower.startsWith("about:")) return false;
        if (/^https?:\/\//.test(lower)) return true;
        if (/^\/\//.test(lower)) return true;
        if (/^(ws|wss|ftp|sftp):\/\//.test(lower)) return true;
        return false;
      };
      try {
        const checks = [
          ["link[href]",   "href"],
          ["script[src]",  "src"],
          ["img[src]",     "src"],
          ["iframe[src]",  "src"],
          ["audio[src]",   "src"],
          ["video[src]",   "src"],
          ["source[src]",  "src"],
          ["track[src]",   "src"],
          ["object[data]", "data"],
          ["embed[src]",   "src"],
          ["form[action]", "action"],
          ["use[href]",    "href"],
        ];
        for (const [sel, attr] of checks) {
          document.querySelectorAll(sel).forEach((el) => {
            const v = el.getAttribute(attr);
            if (isExternal(v)) offenders.push({ tag: el.tagName.toLowerCase(), attr, url: v });
          });
        }
      } catch (e) {
        return { ok: false, error: String((e && e.message) || e), offenders };
      }
      return { ok: offenders.length === 0, offenders };
    }

    // ===================================================================
    // Command Palette + Examples Gallery
    // -------------------------------------------------------------------
    // Centralized action registry, fuzzy search modal, and a curated set of
    // example scenes. The palette is the single discoverability surface for
    // every action in the app: switch pages/themes, recompile, regenerate
    // matrices, load examples, save snapshots, etc.
    // ===================================================================

    const LS_PALETTE_RECENT = "svg42:palette:recent";
    const PALETTE_RECENT_LIMIT = 8;
    const PALETTE_MAX_RESULTS = 80;

    // Examples are pre-built scene presets. Each one applies a distinctive
    // combination of matrix profile, Phase 2 prep, and Phase 3 pipeline to
    // showcase the platform's range. Uses DEFAULT_DSL so channel names stay
    // consistent across loads.
    const EXAMPLE_SCENES = [
      {
        id: "default-swarm",
        name: "Default Swarm",
        desc: "Baseline 120-entity swarm with default presets.",
        tags: ["start", "swarm", "default"],
        icon: "✦",
        profile: "swarm",
        seed: 42,
        count: 120,
        phase2: PHASE2_DEFAULT,
        phase3: PHASE3_DEFAULT,
      },
      {
        id: "mandala-bloom",
        name: "Mandala Bloom",
        desc: "Radial 12-arm mandala with neon-drift hue drift.",
        tags: ["mandala", "radial", "neon", "bloom"],
        icon: "✺",
        profile: "mandala",
        seed: 7,
        count: 144,
        phase2: [
          "# Mandala bloom",
          "entities 144",
          "preset mandala",
          "wave 4 1.0 1.6 0",
          "wave 17 36 1.2 0",
          "set 9 8",
          "set 18 70",
          "set 19 60",
        ].join("\n"),
        phase3: [
          "# Phase 3: glow + hue quantize",
          "macro neon-drift",
          "gain glow 1.4",
          "sort hue asc",
        ].join("\n"),
      },
      {
        id: "glitch-grid",
        name: "Glitch Grid",
        desc: "Snapped-to-grid pixel mosaic with chromatic jitter.",
        tags: ["glitch", "grid", "pixel", "mosaic"],
        icon: "▦",
        profile: "glitch",
        seed: 13,
        count: 168,
        phase2: [
          "# Glitch grid",
          "entities 168",
          "preset glitch",
          "quantize x 24",
          "quantize y 24",
          "set 9 5",
          "noise 17 90",
        ].join("\n"),
        phase3: [
          "# Phase 3: pixel-grid mood",
          "macro pixel-grid",
          "bias hue -20",
          "gain glow 0.8",
        ].join("\n"),
      },
      {
        id: "nebula-drift",
        name: "Nebula Drift",
        desc: "Soft gas clouds drifting on noise; vaporwave palette.",
        tags: ["nebula", "vapor", "soft", "drift"],
        icon: "☁",
        profile: "swarm",
        seed: 21,
        count: 200,
        phase2: [
          "# Nebula drift",
          "entities 200",
          "preset nebula",
          "noise 1 280",
          "noise 2 240",
          "noise 18 80",
          "set 4 0.9",
          "set 8 1",
        ].join("\n"),
        phase3: [
          "# Phase 3: vapor",
          "macro vapor",
          "bias hue 12",
          "gain fillAlpha 0.85",
          "sort z asc",
        ].join("\n"),
      },
      {
        id: "constellation-map",
        name: "Constellation Map",
        desc: "Sparse bright points arranged like a star chart.",
        tags: ["constellation", "stars", "sparse"],
        icon: "✧",
        profile: "swarm",
        seed: 5,
        count: 96,
        phase2: [
          "# Constellation",
          "entities 96",
          "set 4 1.6",
          "set 8 0",
          "set 9 6",
          "set 18 80",
          "set 19 70",
          "noise 17 200",
        ].join("\n"),
        phase3: [
          "# Phase 3: constellation",
          "macro constellation",
          "gain strokeW 1.6",
          "sort z desc",
        ].join("\n"),
      },
      {
        id: "crystal-lattice",
        name: "Crystal Lattice",
        desc: "Quantized rotations and ice-cool hues.",
        tags: ["crystal", "ice", "quantize", "lattice"],
        icon: "❅",
        profile: "mandala",
        seed: 99,
        count: 132,
        phase2: [
          "# Crystal lattice",
          "entities 132",
          "preset mandala",
          "quantize 4 12",
          "quantize 17 24",
          "set 9 5",
        ].join("\n"),
        phase3: [
          "# Phase 3: ice-shard then crystalize",
          "macro ice-shard",
          "macro crystalize",
        ].join("\n"),
      },
      {
        id: "rainfall",
        name: "Rainfall",
        desc: "Y-sorted streaks falling from the top of the stage.",
        tags: ["rain", "streaks", "vertical"],
        icon: "╳",
        profile: "glitch",
        seed: 11,
        count: 220,
        phase2: [
          "# Rainfall",
          "entities 220",
          "preset glitch",
          "set 4 0.6",
          "set 8 2",
          "set 9 4",
          "set 5 -180",
          "noise 1 60",
        ].join("\n"),
        phase3: [
          "# Phase 3: rainfall",
          "macro rainfall",
          "bias y -20",
        ].join("\n"),
      },
      {
        id: "ember-ash",
        name: "Ember Ash",
        desc: "Warm embers floating upward, low saturation backdrop.",
        tags: ["fire", "ember", "warm", "ash"],
        icon: "❍",
        profile: "swarm",
        seed: 23,
        count: 180,
        phase2: [
          "# Ember ash",
          "entities 180",
          "preset nebula",
          "set 4 0.8",
          "set 8 0",
          "set 9 5",
          "noise 18 80",
          "set 5 80",
        ].join("\n"),
        phase3: [
          "# Phase 3: ember",
          "macro ember",
          "gain glow 1.45",
          "sort y asc",
        ].join("\n"),
      },
    ];

    function applyExampleScene(ex) {
      if (!ex) return;
      try {
        if (ui.builderDsl) ui.builderDsl.value = DEFAULT_DSL;
        if (ui.entityCount) ui.entityCount.value = String(ex.count || 120);
        if (ui.seed) ui.seed.value = String(ex.seed != null ? ex.seed : 42);
        if (ui.profile) ui.profile.value = ex.profile || "swarm";
        ui.matrixInput.value = generateRows(ex.count || 120, ex.seed != null ? ex.seed : 42, ex.profile || "swarm");
        ui.phase2Input.value = ex.phase2 || PHASE2_DEFAULT;
        ui.phase3Input.value = ex.phase3 || PHASE3_DEFAULT;
        schema = parseDsl(ui.builderDsl.value);
        compileAndReport();
      } catch (e) {
        console.error("[svg42:example]", ex.id, e);
        showToast("Could not load example: " + (ex.name || ex.id), "error");
      }
    }

    // -------------------------------------------------------------------
    // Action registry
    // -------------------------------------------------------------------
    const ACTION_REGISTRY = [];
    function registerAction(spec) {
      if (!spec || typeof spec.run !== "function" || !spec.id) return null;
      ACTION_REGISTRY.push({
        id: spec.id,
        label: spec.label || spec.id,
        group: spec.group || "general",
        keywords: spec.keywords || "",
        icon: spec.icon || "•",
        hotkey: spec.hotkey || "",
        run: spec.run,
      });
      return spec;
    }

    function buildActionRegistry() {
      // Pages
      try {
        PAGE_LIST.forEach((p) => {
          const pt = (typeof PAGE_TAGS !== "undefined" && PAGE_TAGS[p]) ? PAGE_TAGS[p] : null;
          registerAction({
            id: "page:" + p,
            label: "Go to " + p,
            group: "navigate",
            icon: "→",
            keywords: "page goto navigate " + p + " " + (pt ? (pt.tag + " " + pt.meta) : ""),
            hotkey: ({ build: "1", stage: "2", inspect: "3", analyze: "4", lab: "5", all: "0" })[p] || "",
            run: () => setActivePage(p, true),
          });
        });
      } catch (e) { /* page system may not be ready */ }

      // Themes
      [
        ["synthwave", "Switch theme: synthwave (mint neon)"],
        ["default",   "Switch theme: default"],
        ["midnight",  "Switch theme: midnight"],
        ["lab",       "Switch theme: lab (light)"],
      ].forEach(([t, label]) => {
        registerAction({
          id: "theme:" + t,
          label,
          group: "theme",
          icon: "◐",
          keywords: "theme color appearance " + t,
          run: () => {
            try { applyTheme(t); } catch (_) {}
            try { if (ui.themeSelect) ui.themeSelect.value = t; } catch (_) {}
            try { safeLocalSet("svg42:theme", t); } catch (_) {}
            showToast("Theme: " + t, "ok");
          },
        });
      });

      // Build / compile
      registerAction({ id: "compile", label: "Compile (apply DSL + matrix + phases)", group: "build", icon: "⚙", keywords: "compile build run apply rerun", run: () => { compileAndReport(); showToast("Recompiled", "ok"); } });
      registerAction({ id: "compile.reset-dsl", label: "Reset DSL to defaults", group: "build", icon: "↺", keywords: "reset dsl default channels", run: () => { ui.builderDsl.value = DEFAULT_DSL; schema = parseDsl(DEFAULT_DSL); compileAndReport(); showToast("DSL reset", "ok"); } });
      registerAction({ id: "compile.regen-matrix", label: "Regenerate matrix (next seed)", group: "build", icon: "✦", keywords: "matrix regenerate random seed", run: () => {
        const s = ((Number(ui.seed && ui.seed.value) || 42) + 1) | 0;
        if (ui.seed) ui.seed.value = String(s);
        const c = Number(ui.entityCount && ui.entityCount.value) || 120;
        const p = (ui.profile && ui.profile.value) || "swarm";
        ui.matrixInput.value = generateRows(c, s, p);
        compileAndReport();
        showToast("Matrix regenerated (seed=" + s + ")", "ok");
      }});

      // Stage
      registerAction({ id: "stage.reset-view", label: "Reset stage view (zoom + pan)", group: "stage", icon: "⤤", keywords: "stage reset view zoom pan center", run: () => { try { resetStageView(); } catch (_) {} } });
      registerAction({ id: "stage.png", label: "Download stage as PNG", group: "stage", icon: "⤓", keywords: "export png raster image download", run: () => { try { rasterizeStageToPng(); } catch (_) {} } });
      registerAction({ id: "stage.hud", label: "Toggle stage HUD", group: "stage", icon: "▤", keywords: "hud overlay performance fps", run: () => { try { setStageHud(!stageHudShown); } catch (_) {} } });

      // Snapshots
      registerAction({ id: "snapshot.save", label: "Save snapshot of current state", group: "snapshot", icon: "✶", keywords: "snapshot save state checkpoint", run: () => { try { saveSnapshot(); } catch (_) {} } });

      // Help / utilities
      registerAction({ id: "help.docs", label: "Toggle docs drawer", group: "help", icon: "?", keywords: "docs help guide reference", run: () => { try { toggleHelpDrawer(); } catch (_) {} } });
      registerAction({ id: "help.cheat", label: "Toggle hotkey cheatsheet", group: "help", icon: "⌨", keywords: "hotkeys cheatsheet keyboard shortcuts", run: () => { try { toggleCheatsheet(); } catch (_) {} } });
      registerAction({ id: "help.share", label: "Copy shareable link to clipboard", group: "help", icon: "🔗", keywords: "share copy url link permalink", run: () => { try { shareCurrentLink(); } catch (_) {} } });
      registerAction({ id: "help.palette", label: "Open command palette", group: "help", icon: "⌘", keywords: "command palette search run", hotkey: "Ctrl+K", run: () => openCommandPalette() });
      registerAction({ id: "help.offline", label: "Show offline-readiness status", group: "help", icon: "◉", keywords: "offline network status report", run: () => {
        const audit = auditExternalRefs();
        const online = (typeof navigator !== "undefined") ? navigator.onLine : true;
        showToast("Offline-ready: " + (audit.ok ? "yes" : "no") + " · network: " + (online ? "online" : "offline") + " · external refs: " + audit.offenders.length, "ok");
      }});

      // Examples
      EXAMPLE_SCENES.forEach((ex) => {
        registerAction({
          id: "example:" + ex.id,
          label: "Load example · " + ex.name,
          group: "example",
          icon: ex.icon || "✦",
          keywords: "example scene demo preset load " + (ex.tags || []).join(" ") + " " + (ex.desc || ""),
          run: () => { applyExampleScene(ex); showToast("Loaded example: " + ex.name, "ok"); },
        });
      });

      // Export · app · serve (no compiler-grade self-hosting; see module header)
      try { registerExportAndServeActions(); } catch (e) { console.error("[svg42:export] action registration failed", e); }
    }

    // -------------------------------------------------------------------
    // Fuzzy match
    // -------------------------------------------------------------------
    function fuzzyScore(query, text) {
      if (!query) return { score: 0, ranges: [] };
      const q = String(query).toLowerCase();
      const t = String(text).toLowerCase();
      if (!q || !t) return null;
      const ranges = [];
      let qi = 0;
      let score = 0;
      let prev = -2;
      for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t.charCodeAt(ti) === q.charCodeAt(qi)) {
          let bonus = 1;
          const ch = ti > 0 ? t.charCodeAt(ti - 1) : 0;
          // word-start bonus (after space/dash/dot/colon/underscore)
          if (ti === 0 || ch === 32 || ch === 45 || ch === 46 || ch === 58 || ch === 95 || ch === 62) bonus += 5;
          if (prev === ti - 1) bonus += 3;
          score += bonus;
          ranges.push(ti);
          prev = ti;
          qi++;
        }
      }
      if (qi < q.length) return null;
      score -= (t.length - q.length) * 0.02;
      return { score, ranges };
    }

    function highlightMatch(text, ranges) {
      if (!ranges || !ranges.length) return escapeHtml(text);
      let out = "";
      let last = 0;
      for (const r of ranges) {
        if (r < last || r >= text.length) continue;
        out += escapeHtml(text.slice(last, r));
        out += "<mark>" + escapeHtml(text.charAt(r)) + "</mark>";
        last = r + 1;
      }
      out += escapeHtml(text.slice(last));
      return out;
    }

    // -------------------------------------------------------------------
    // Palette state and rendering
    // -------------------------------------------------------------------
    let _paletteOpen = false;
    let _paletteSelected = 0;
    let _paletteFiltered = [];

    function getPaletteRecents() {
      try {
        const raw = safeLocalGet(LS_PALETTE_RECENT);
        const a = raw ? JSON.parse(raw) : [];
        return Array.isArray(a) ? a.slice(0, PALETTE_RECENT_LIMIT) : [];
      } catch (_) { return []; }
    }
    function pushPaletteRecent(id) {
      try {
        const r = getPaletteRecents().filter((x) => x !== id);
        r.unshift(id);
        while (r.length > PALETTE_RECENT_LIMIT) r.pop();
        safeLocalSet(LS_PALETTE_RECENT, JSON.stringify(r));
      } catch (_) { /* swallow */ }
    }

    function refreshPaletteResults() {
      if (!ui.paletteInput || !ui.paletteResults) return;
      const q = (ui.paletteInput.value || "").trim();
      let results;
      if (!q) {
        const recents = getPaletteRecents();
        const recentMap = new Map();
        recents.forEach((id, i) => recentMap.set(id, i));
        results = ACTION_REGISTRY.slice().sort((a, b) => {
          const ra = recentMap.has(a.id) ? recentMap.get(a.id) : 9999;
          const rb = recentMap.has(b.id) ? recentMap.get(b.id) : 9999;
          if (ra !== rb) return ra - rb;
          return a.label.localeCompare(b.label);
        });
        results = results.map((a) => ({ a, score: 0, ranges: [] }));
      } else {
        results = [];
        for (const a of ACTION_REGISTRY) {
          const haystack = a.label + " " + (a.keywords || "") + " " + (a.group || "");
          const m = fuzzyScore(q, haystack);
          if (m) {
            const labelMatch = fuzzyScore(q, a.label);
            const ranges = labelMatch ? labelMatch.ranges : [];
            // Bonus if the query matches the label itself
            const score = m.score + (labelMatch ? labelMatch.score * 0.5 : 0);
            results.push({ a, score, ranges });
          }
        }
        results.sort((x, y) => y.score - x.score);
      }
      _paletteFiltered = results;
      if (_paletteSelected >= results.length) _paletteSelected = Math.max(0, results.length - 1);
      if (_paletteSelected < 0) _paletteSelected = 0;
      renderPaletteResults();
    }

    function renderPaletteResults() {
      const ul = ui.paletteResults;
      if (!ul) return;
      const total = ACTION_REGISTRY.length;
      if (!_paletteFiltered.length) {
        ul.innerHTML = '<li class="palette-empty">No commands match. Try a different word.</li>';
        if (ui.paletteCount) ui.paletteCount.textContent = "0 / " + total;
        return;
      }
      const showRecentsHeader = !ui.paletteInput.value.trim() && getPaletteRecents().length > 0;
      const head = showRecentsHeader
        ? '<li class="palette-empty" style="padding:6px 12px;text-align:left;letter-spacing:0.18em;font-size:0.62rem;color:var(--muted)">recent · type to search · ' + total + ' actions</li>'
        : "";
      const slice = _paletteFiltered.slice(0, PALETTE_MAX_RESULTS);
      const items = slice.map((r, i) => {
        const a = r.a;
        const label = highlightMatch(a.label, r.ranges);
        const group = escapeHtml(a.group || "");
        const icon = escapeHtml(a.icon || "•");
        const cls = "palette-item" + (i === _paletteSelected ? " active" : "");
        const meta = a.hotkey ? '<kbd>' + escapeHtml(a.hotkey) + '</kbd>' : '';
        return '<li role="option" aria-selected="' + (i === _paletteSelected ? "true" : "false") + '" class="' + cls + '" data-idx="' + i + '">' +
          '<span class="pi-icon" aria-hidden="true">' + icon + '</span>' +
          '<span class="pi-label"><span class="pi-name">' + label + '</span><span class="pi-group">' + group + '</span></span>' +
          '<span class="pi-meta">' + meta + '</span>' +
          '</li>';
      }).join("");
      ul.innerHTML = head + items;
      if (ui.paletteCount) ui.paletteCount.textContent = _paletteFiltered.length + " / " + total;
      const active = ul.querySelector(".palette-item.active");
      if (active && active.scrollIntoView) {
        try { active.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (_) {}
      }
    }

    function runAction(action) {
      if (!action || typeof action.run !== "function") return;
      try { pushPaletteRecent(action.id); } catch (_) {}
      closeCommandPalette();
      try {
        action.run();
      } catch (e) {
        console.error("[svg42:action]", action.id, e);
        try { showToast("Action failed: " + (action.label || action.id), "error"); } catch (_) {}
      }
    }

    function openCommandPalette(prefill) {
      if (!ui.commandPaletteOverlay || !ui.paletteInput) return;
      _paletteOpen = true;
      _paletteSelected = 0;
      ui.commandPaletteOverlay.setAttribute("data-open", "true");
      ui.paletteInput.value = (typeof prefill === "string") ? prefill : "";
      refreshPaletteResults();
      // Focus on next frame so the overlay is visible first
      requestAnimationFrame(() => {
        try { ui.paletteInput.focus(); ui.paletteInput.select(); } catch (_) {}
      });
    }
    function closeCommandPalette() {
      if (!ui.commandPaletteOverlay) return;
      _paletteOpen = false;
      ui.commandPaletteOverlay.setAttribute("data-open", "false");
    }

    function handlePaletteKey(ev) {
      if (!_paletteOpen) return;
      switch (ev.key) {
        case "Escape":
          ev.preventDefault(); closeCommandPalette(); return;
        case "ArrowDown":
          ev.preventDefault();
          _paletteSelected = Math.min(_paletteSelected + 1, _paletteFiltered.length - 1);
          renderPaletteResults();
          return;
        case "ArrowUp":
          ev.preventDefault();
          _paletteSelected = Math.max(_paletteSelected - 1, 0);
          renderPaletteResults();
          return;
        case "Home":
          ev.preventDefault();
          _paletteSelected = 0;
          renderPaletteResults();
          return;
        case "End":
          ev.preventDefault();
          _paletteSelected = Math.max(0, Math.min(_paletteFiltered.length, PALETTE_MAX_RESULTS) - 1);
          renderPaletteResults();
          return;
        case "Enter":
          ev.preventDefault();
          {
            const r = _paletteFiltered[_paletteSelected];
            if (r) runAction(r.a);
          }
          return;
        case "Tab":
          // accept current selection's label as autocomplete (if any)
          ev.preventDefault();
          {
            const r = _paletteFiltered[_paletteSelected];
            if (r && r.a && r.a.label) {
              ui.paletteInput.value = r.a.label;
              refreshPaletteResults();
            }
          }
          return;
        default:
          return;
      }
    }

    // ===================================================================
    // Export / app / serve module
    // -------------------------------------------------------------------
    // NOTE ON NAMING. This is *not* "self-hosting" in the compiler sense.
    // A self-hosting compiler is one whose own source it can compile to a
    // working compiler, with a fixpoint such that consecutive generations
    // are byte-identical (e.g. zcc1 builds zcc2; zcc2 builds zcc3 from the
    // same source; zcc2.s == zcc3.s). There is no such bootstrap chain or
    // semantic closure here — the page just snapshots its own outerHTML
    // bytes into a Blob and offers them as a download. Calling that
    // "self-host" would be marketing, not engineering, so this module is
    // named for what it actually does: export a standalone copy, expose
    // PWA install + runtime-diagnostic plumbing, and copy-paste a few
    // server one-liners so the user can host the file folder locally with
    // whatever tool they already have installed.
    //
    // It does, however, reuse the existing share-payload format as the
    // bootstate contract so the in-page export and the URL-hash share
    // link have a single source of truth.
    // ===================================================================

    let _deferredInstallPrompt = null;
    try {
      window.addEventListener("beforeinstallprompt", (ev) => {
        try { ev.preventDefault(); } catch (_) { /* noop */ }
        _deferredInstallPrompt = ev;
        try { console.info("[svg42:install] install prompt available — run \"install\" from ⌘K"); } catch (_) { /* noop */ }
      });
      window.addEventListener("appinstalled", () => {
        _deferredInstallPrompt = null;
        try { console.info("[svg42:install] app installed"); } catch (_) { /* noop */ }
        try { showToast("App installed.", "ok"); } catch (_) { /* noop */ }
      });
    } catch (_) { /* swallow */ }

    function getRuntimeInfo() {
      let storageBytes = 0;
      let storageKeys = 0;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          const v = localStorage.getItem(k) || "";
          storageBytes += (k ? k.length : 0) + v.length;
          storageKeys++;
        }
      } catch (_) { /* swallow */ }
      const proto = (typeof location !== "undefined" && location.protocol) || "?";
      const isStandalone = (typeof window !== "undefined")
        && (
          (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
          || (typeof navigator !== "undefined" && navigator.standalone === true)
        );
      const docBytes = (document.documentElement && document.documentElement.outerHTML)
        ? document.documentElement.outerHTML.length
        : 0;
      return {
        href: (typeof location !== "undefined") ? location.href : "",
        protocol: proto,
        onFile: proto === "file:",
        onHttp: proto === "http:" || proto === "https:",
        isStandalone: !!isStandalone,
        canInstall: !!_deferredInstallPrompt,
        installSupported: typeof window !== "undefined" && "BeforeInstallPromptEvent" in window,
        storageBytes,
        storageKeys,
        docBytes,
        title: document.title || "",
        online: typeof navigator !== "undefined" ? navigator.onLine !== false : true,
        userAgent: (typeof navigator !== "undefined" && navigator.userAgent) ? navigator.userAgent : "",
      };
    }

    function fmtBytes(n) {
      if (!Number.isFinite(n)) return "?";
      if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + " MB";
      if (n >= 1024) return (n / 1024).toFixed(1) + " KB";
      return n + " B";
    }

    function buildRuntimeReport() {
      const info = getRuntimeInfo();
      return [
        "SVG42 runtime status",
        "  location:        " + (info.href || "(unknown)"),
        "  protocol:        " + info.protocol + (info.onFile ? "  (loaded as a local file)" : info.onHttp ? "  (served over network)" : ""),
        "  installed PWA:   " + (info.isStandalone ? "yes (standalone)" : "no"),
        "  install prompt:  " + (info.canInstall ? "available  (run 'install' command)"
                                  : info.installSupported ? "supported but not currently offered"
                                  : "not supported by this browser"),
        "  document size:   " + fmtBytes(info.docBytes),
        "  localStorage:    " + fmtBytes(info.storageBytes) + " in " + info.storageKeys + " keys",
        "  network status:  " + (info.online ? "online" : "offline") + " (the app does not need either)",
        "  user agent:      " + info.userAgent,
      ].join("\n");
    }

    // Strip <script id="svg42-bootstate"> blocks (so re-export doesn't nest)
    function _stripBootstateNodes(html) {
      return html.replace(/<script\b[^>]*\bid=["']svg42-bootstate["'][^>]*>[\s\S]*?<\/script>/gi, "");
    }

    // Quote JSON safely for an inline <script> payload (escape closing tag
    // and any HTML-comment-looking sequences so the HTML parser doesn't
    // enter script-data-escaped state).
    function _safeScriptJson(obj) {
      const reCloseTag = /<\/script/gi;
      const reHtmlOpenComment = new RegExp("<" + "!" + "--", "g");
      const reHtmlCloseComment = new RegExp("--" + ">", "g");
      return JSON.stringify(obj)
        .replace(reCloseTag, "<\\/script")
        .replace(reHtmlOpenComment, "<\\!--")
        .replace(reHtmlCloseComment, "--\\>")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
    }

    function exportStandaloneCopy(opts) {
      opts = opts || {};
      const baked = opts.bakeState !== false;
      try {
        // Snapshot the live document
        let html = document.documentElement.outerHTML;
        // Reset transient runtime state in the clone
        html = html.replace(/data-open="true"/g, 'data-open="false"');
        html = _stripBootstateNodes(html);
        if (baked) {
          const payload = buildSharePayload();
          const json = _safeScriptJson(payload);
          const tag = '<script type="application\/json" id="svg42-bootstate">' + json + '<\/script>';
          if (/<\/body>/i.test(html)) {
            html = html.replace(/<\/body>/i, tag + "\n</body>");
          } else {
            html += tag;
          }
        }
        const doc = "<!doctype html>\n" + html;
        const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        a.href = url;
        a.download = "svg42_app_" + stamp + (baked ? "_with-state" : "_blank") + ".html";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try { document.body.removeChild(a); } catch (_) { /* noop */ }
          try { URL.revokeObjectURL(url); } catch (_) { /* noop */ }
        }, 1500);
        showToast("Saved " + (baked ? "standalone copy (with state)" : "blank copy") + " (" + (doc.length / 1024).toFixed(0) + " KB)", "ok");
      } catch (e) {
        console.error("[svg42:export]", e);
        showToast("Save failed: " + (e && e.message || e), "error");
      }
    }

    // On boot, if a <script id="svg42-bootstate"> JSON block is present,
    // hydrate the app from it. Returns true if state was applied.
    function tryApplyEmbeddedBootstate() {
      try {
        const node = document.getElementById("svg42-bootstate");
        if (!node) return false;
        const raw = (node.textContent || "").trim();
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (!data || data.v !== 1) return false;
        const ok = applySharePayload(data);
        if (ok) {
          try { showToast("Loaded baked-in state from clone.", "ok"); } catch (_) { /* noop */ }
        }
        return !!ok;
      } catch (e) {
        console.error("[svg42:bootstate]", e);
        return false;
      }
    }

    function buildIframeSnippet(width, height) {
      const w = Math.max(320, Math.floor(Number(width) || 1024));
      const h = Math.max(240, Math.floor(Number(height) || 720));
      const here = (typeof location !== "undefined") ? (location.href.split("#")[0]) : "./svg42_compiler_builder.html";
      const sandbox = "allow-scripts allow-same-origin allow-downloads allow-popups allow-forms";
      return '<iframe src="' + escapeHtml(here) + '" width="' + w + '" height="' + h
        + '" style="border:1px solid #4c2890;border-radius:10px;background:#0a061a"'
        + ' sandbox="' + sandbox + '" loading="lazy" referrerpolicy="no-referrer"'
        + ' title="SVG42 compiler builder"></iframe>';
    }

    function _copyToClipboard(text, okMsg) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            () => showToast(okMsg || "Copied to clipboard", "ok"),
            () => { try { console.log("[svg42:copy]\n" + text); } catch (_) {} showToast("Could not copy. Logged to console.", "warn"); }
          );
          return;
        }
      } catch (_) { /* fall through */ }
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast(okMsg || "Copied to clipboard", "ok");
      } catch (_) {
        try { console.log("[svg42:copy]\n" + text); } catch (__) {}
        showToast("Could not copy. Logged to console.", "warn");
      }
    }

    function copyIframeSnippet() {
      const snippet = buildIframeSnippet();
      _copyToClipboard(snippet, "Iframe embed snippet copied (" + snippet.length + " chars)");
      try { console.log("[svg42:embed]\n" + snippet); } catch (_) { /* noop */ }
    }

    // Curated host one-liners. The user picks one that matches their
    // environment; serving any folder containing this HTML file is enough.
    const LOCAL_SERVE_CMDS = [
      { id: "python",  label: "python3 -m http.server (Python 3)",     cmd: "python3 -m http.server 8042" },
      { id: "python2", label: "python -m SimpleHTTPServer (Python 2)", cmd: "python -m SimpleHTTPServer 8042" },
      { id: "node",    label: "npx serve (Node.js, no install)",       cmd: "npx --yes serve -l 8042 ." },
      { id: "node-http", label: "npx http-server (Node.js)",           cmd: "npx --yes http-server -p 8042 ." },
      { id: "php",     label: "php -S (PHP built-in server)",          cmd: "php -S 0.0.0.0:8042 -t ." },
      { id: "ruby",    label: "ruby webrick",                          cmd: "ruby -run -e httpd . -p 8042" },
      { id: "deno",    label: "deno run file_server.ts",               cmd: "deno run --allow-net --allow-read https://deno.land/std/http/file_server.ts --port 8042" },
      { id: "busybox", label: "busybox httpd",                         cmd: "busybox httpd -f -p 8042 -h ." },
      { id: "caddy",   label: "caddy file-server",                     cmd: "caddy file-server --listen :8042 --root ." },
    ];

    function registerExportAndServeActions() {
      registerAction({
        id: "export.with-state",
        label: "Save standalone copy of app (current state baked in)",
        group: "export",
        icon: "⤓",
        keywords: "save copy export standalone portable bake state offline download bundle",
        run: () => exportStandaloneCopy({ bakeState: true }),
      });
      registerAction({
        id: "export.blank",
        label: "Save fresh copy of app (no state baked in)",
        group: "export",
        icon: "⤓",
        keywords: "save fresh blank factory reset clean export download copy",
        run: () => exportStandaloneCopy({ bakeState: false }),
      });
      registerAction({
        id: "app.runtime-info",
        label: "Show runtime status report (console + toast)",
        group: "app",
        icon: "ℹ",
        keywords: "runtime report status info pwa install storage offline diagnostics protocol",
        run: () => {
          const info = getRuntimeInfo();
          const report = buildRuntimeReport();
          try { console.log(report); } catch (_) { /* noop */ }
          showToast("Runtime: " + info.protocol + " · doc " + fmtBytes(info.docBytes) + " · LS " + fmtBytes(info.storageBytes), "ok");
        },
      });
      registerAction({
        id: "app.install-pwa",
        label: "Install as PWA (if browser offers it)",
        group: "app",
        icon: "⤴",
        keywords: "install pwa app standalone home screen add",
        run: () => {
          if (!_deferredInstallPrompt) {
            showToast("Install prompt not available. Browser hasn't offered it yet.", "warn");
            return;
          }
          try {
            _deferredInstallPrompt.prompt();
            const userChoice = _deferredInstallPrompt.userChoice;
            if (userChoice && typeof userChoice.then === "function") {
              userChoice.then((c) => {
                showToast("Install: " + (c && c.outcome === "accepted" ? "accepted" : "dismissed"), "ok");
                _deferredInstallPrompt = null;
              }).catch((e) => {
                showToast("Install: " + (e && e.message || e), "warn");
              });
            }
          } catch (e) {
            console.error("[svg42:install]", e);
            showToast("Install failed: " + (e && e.message || e), "error");
          }
        },
      });
      registerAction({
        id: "app.copy-embed-snippet",
        label: "Copy <iframe> embed snippet for current URL",
        group: "app",
        icon: "⌗",
        keywords: "embed iframe copy snippet link share",
        run: () => copyIframeSnippet(),
      });
      registerAction({
        id: "app.open-phase4",
        label: "Open Phase 4 · PRIME recursive coupled recurrence (new tab)",
        group: "app",
        icon: "↗",
        keywords: "phase 4 four prime evolution lyapunov recurrence chaos hamiltonian dynamics ensemble",
        run: () => {
          try {
            const w = window.open("svg42_phase4_prime.html", "_blank", "noopener,noreferrer");
            if (!w) {
              showToast("Couldn't open Phase 4 (popup blocked?). Use the toolbar link.", "warn");
            } else {
              showToast("Phase 4 opening in new tab", "ok");
            }
          } catch (e) {
            showToast("Phase 4 open failed: " + (e && e.message || e), "error");
          }
        },
      });
      registerAction({
        id: "app.copy-url",
        label: "Copy current location URL",
        group: "app",
        icon: "🔗",
        keywords: "copy url location link share",
        run: () => {
          const u = (typeof location !== "undefined") ? location.href : "";
          _copyToClipboard(u, "URL copied: " + u);
        },
      });
      LOCAL_SERVE_CMDS.forEach((c) => {
        registerAction({
          id: "serve." + c.id,
          label: "Copy local-serve command · " + c.label,
          group: "serve",
          icon: "▶",
          keywords: "serve host server command shell terminal copy " + c.id + " " + c.cmd,
          run: () => _copyToClipboard(c.cmd, "Copied: " + c.cmd),
        });
      });
    }

    function applyStageTransform() {
      const svgs = ui.stage.querySelectorAll(":scope > svg");
      const tr = `translate(${stagePanX.toFixed(1)}px, ${stagePanY.toFixed(1)}px) scale(${stageZoom.toFixed(3)})`;
      svgs.forEach((svg) => { svg.style.transform = tr; });
    }
    function resetStageView() {
      stageZoom = 1;
      stagePanX = 0;
      stagePanY = 0;
      applyStageTransform();
      showToast("View reset", "ok");
    }
    function stageClientToSvg(clientX, clientY, svgEl) {
      if (!svgEl) return null;
      const rect = svgEl.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const sx = (clientX - rect.left) / rect.width;
      const sy = (clientY - rect.top) / rect.height;
      return { x: sx * STAGE_VIEW_W, y: sy * STAGE_VIEW_H, rect };
    }
    function entitiesInBox(activeIr, box, t) {
      if (!activeIr) return [];
      const ids = [];
      for (const e of activeIr.entities) {
        const pos = entityScreenPos(e, t);
        if (pos.x >= box.x1 && pos.x <= box.x2 && pos.y >= box.y1 && pos.y <= box.y2) ids.push(e.id);
      }
      return ids;
    }
    function startStagePan(ev) {
      stagePanning = true;
      stagePanStart = { px: stagePanX, py: stagePanY, mx: ev.clientX, my: ev.clientY };
      ui.stage.classList.add("is-panning");
    }
    function moveStagePan(ev) {
      if (!stagePanning || !stagePanStart) return;
      stagePanX = stagePanStart.px + (ev.clientX - stagePanStart.mx);
      stagePanY = stagePanStart.py + (ev.clientY - stagePanStart.my);
      applyStageTransform();
    }
    function endStagePan() {
      stagePanning = false;
      stagePanStart = null;
      ui.stage.classList.remove("is-panning");
    }
    function startStageBrush(ev) {
      stageBrushing = true;
      const stageRect = ui.stage.getBoundingClientRect();
      stageBrushStart = {
        clientX: ev.clientX,
        clientY: ev.clientY,
        offX: ev.clientX - stageRect.left,
        offY: ev.clientY - stageRect.top
      };
      stageBrushEl = document.createElement("div");
      stageBrushEl.className = "brush-rect";
      stageBrushEl.style.left = stageBrushStart.offX + "px";
      stageBrushEl.style.top = stageBrushStart.offY + "px";
      stageBrushEl.style.width = "0px";
      stageBrushEl.style.height = "0px";
      ui.stage.appendChild(stageBrushEl);
    }
    function moveStageBrush(ev) {
      if (!stageBrushing || !stageBrushEl || !stageBrushStart) return;
      const stageRect = ui.stage.getBoundingClientRect();
      const cx = ev.clientX - stageRect.left;
      const cy = ev.clientY - stageRect.top;
      const x1 = Math.min(stageBrushStart.offX, cx);
      const y1 = Math.min(stageBrushStart.offY, cy);
      const x2 = Math.max(stageBrushStart.offX, cx);
      const y2 = Math.max(stageBrushStart.offY, cy);
      stageBrushEl.style.left = x1 + "px";
      stageBrushEl.style.top = y1 + "px";
      stageBrushEl.style.width = (x2 - x1) + "px";
      stageBrushEl.style.height = (y2 - y1) + "px";
    }
    function endStageBrush(ev, modifier) {
      if (!stageBrushing || !stageBrushStart) return;
      const svgEl = ui.stage.querySelector(":scope > svg");
      const start = stageClientToSvg(stageBrushStart.clientX, stageBrushStart.clientY, svgEl);
      const end = stageClientToSvg(ev.clientX, ev.clientY, svgEl);
      if (stageBrushEl && stageBrushEl.parentNode) stageBrushEl.parentNode.removeChild(stageBrushEl);
      stageBrushEl = null;
      stageBrushing = false;
      stageBrushStart = null;
      if (!start || !end) return;
      const box = {
        x1: Math.min(start.x, end.x),
        y1: Math.min(start.y, end.y),
        x2: Math.max(start.x, end.x),
        y2: Math.max(start.y, end.y)
      };
      if ((box.x2 - box.x1) < 4 || (box.y2 - box.y1) < 4) return;
      const activeIr = previewIr || ir;
      const ids = entitiesInBox(activeIr, box, overlayTime());
      if (!ids.length) {
        showToast("No entities in brush.", "warn");
        return;
      }
      if (modifier === "remove") {
        for (const id of ids) pinnedEntityIds.delete(id);
        showToast(`Unpinned ${ids.length} from brush.`, "ok");
      } else if (modifier === "select") {
        if (ids.length) {
          selectedEntityId = ids[0];
          showToast(`Selected ${ids.length} (last selected #${ids[0]}).`, "ok");
        }
      } else {
        let added = 0;
        for (const id of ids) {
          if (pinnedEntityIds.size >= MAX_PIN_IDS_PER_GROUP * 4) break;
          if (!pinnedEntityIds.has(id)) { pinnedEntityIds.add(id); added += 1; }
        }
        showToast(`Pinned ${added} (${ids.length} in brush).`, "ok");
      }
      persistPinned(true);
      updatePinnedInspector();
      updateLimitsReadout();
      renderCurrent();
    }

    function startTimeline() {
      if (timelinePlaying) return;
      timelinePlaying = true;
      timelineLastTs = 0;
      if (ui.btnTimelinePlay) ui.btnTimelinePlay.textContent = "⏸ Pause";
      const tick = (ts) => {
        if (!timelinePlaying) return;
        if (timelineLastTs === 0) timelineLastTs = ts;
        const fps = numInput(ui.timelineFps, 1, 120, 30);
        const minStep = 1000 / (fps + 5);
        const dt = (ts - timelineLastTs) / 1000;
        if (ts - timelineLastTs >= minStep) {
          timelineLastTs = ts;
          const loop = numInput(ui.timelineLoop, 0.5, 600, TIMELINE_DEFAULT_LOOP);
          stageTime = (stageTime + dt) % loop;
          ui.timeScrub.value = stageTime.toFixed(3);
          ui.timeReadout.textContent = `t = ${stageTime.toFixed(3)}s`;
          renderCurrent();
        }
        timelineRafId = requestAnimationFrame(tick);
      };
      timelineRafId = requestAnimationFrame(tick);
    }
    function stopTimeline() {
      timelinePlaying = false;
      if (timelineRafId) cancelAnimationFrame(timelineRafId);
      timelineRafId = 0;
      if (ui.btnTimelinePlay) ui.btnTimelinePlay.textContent = "▶ Play";
    }
    function toggleTimeline() { timelinePlaying ? stopTimeline() : startTimeline(); }
    function setTimelineLoopBounds() {
      if (!ui.timeScrub || !ui.timelineLoop) return;
      const loop = numInput(ui.timelineLoop, 0.5, 600, TIMELINE_DEFAULT_LOOP);
      ui.timeScrub.max = String(loop);
      if (Number(ui.timeScrub.value) > loop) ui.timeScrub.value = String(loop);
    }
    function rewindTimeline() {
      stageTime = 0;
      if (ui.timeScrub) ui.timeScrub.value = "0";
      if (ui.timeReadout) ui.timeReadout.textContent = "t = 0.000s";
      renderCurrent();
    }
    function persistTimelineState() {
      return safeLocalJsonSet(LS_TIMELINE_KEY, {
        v: 1,
        fps: ui.timelineFps ? ui.timelineFps.value : "30",
        loop: ui.timelineLoop ? ui.timelineLoop.value : String(TIMELINE_DEFAULT_LOOP),
        follow: boolInput(ui.overlaysFollowTime),
        constellation: boolInput(ui.showConstellation),
        labels: boolInput(ui.showPinLabels)
      }, 4096);
    }
    function loadTimelineState() {
      const d = safeLocalJsonGet(LS_TIMELINE_KEY, null);
      if (!d) return;
      if (ui.timelineFps && d.fps) ui.timelineFps.value = String(d.fps);
      if (ui.timelineLoop && d.loop) ui.timelineLoop.value = String(d.loop);
      if (ui.overlaysFollowTime) ui.overlaysFollowTime.checked = !!d.follow;
      if (ui.showConstellation) ui.showConstellation.checked = !!d.constellation;
      if (ui.showPinLabels) ui.showPinLabels.checked = !!d.labels;
      setTimelineLoopBounds();
    }

    function buildHistogram(values, bins) {
      if (!values.length) return { bins: [], min: 0, max: 0, mean: 0, std: 0 };
      let min = Infinity, max = -Infinity, sum = 0;
      for (const v of values) {
        if (v < min) min = v;
        if (v > max) max = v;
        sum += v;
      }
      const mean = sum / values.length;
      let varSum = 0;
      for (const v of values) varSum += (v - mean) * (v - mean);
      const std = Math.sqrt(varSum / values.length);
      const arr = new Array(bins).fill(0);
      const span = max - min;
      if (span <= 0) {
        arr[Math.floor(bins / 2)] = values.length;
        return { bins: arr, min, max, mean, std };
      }
      for (const v of values) {
        let idx = Math.floor(((v - min) / span) * bins);
        if (idx >= bins) idx = bins - 1;
        if (idx < 0) idx = 0;
        arr[idx] += 1;
      }
      return { bins: arr, min, max, mean, std };
    }
    function histogramSvg(hist, color) {
      if (!hist.bins.length) return "";
      const w = 130, h = 28;
      const peak = Math.max(...hist.bins) || 1;
      const bw = w / hist.bins.length;
      const rects = hist.bins.map((c, i) => {
        const bh = Math.max(1, (c / peak) * h);
        const x = (i * bw).toFixed(2);
        return `<rect x="${x}" y="${(h - bh).toFixed(2)}" width="${(bw - 0.6).toFixed(2)}" height="${bh.toFixed(2)}" fill="${color}" />`;
      }).join("");
      return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${rects}</svg>`;
    }
    function refreshChannelAtlas() {
      if (!ui.channelAtlas) return;
      const activeIr = previewIr || ir;
      if (!activeIr || !Array.isArray(activeIr.schema)) {
        ui.channelAtlas.innerHTML = '<p class="small" style="color:var(--muted)">Compile IR to see channel histograms.</p>';
        if (ui.atlasFilterStatus) ui.atlasFilterStatus.textContent = "no filter";
        if (ui.atlasOutlierChannel) ui.atlasOutlierChannel.innerHTML = "";
        return;
      }
      const bins = numInput(ui.histogramBins, 4, 32, 12);
      const heatCh = ui.deltaChannel ? ui.deltaChannel.value : "off";
      const plotCh = ui.plotChannel ? ui.plotChannel.value : "";
      const frag = document.createDocumentFragment();
      activeIr.schema.forEach((spec, idx) => {
        const ch = spec.name;
        const hist = getCachedHistogram(activeIr, ch, bins);
        const flt = atlasFilters.get(ch);
        const card = document.createElement("div");
        const isActive = (ch === heatCh || ch === plotCh);
        card.className = "channel-card" + (isActive ? " active" : "") + (flt ? " filtered" : "");
        card.dataset.channel = ch;
        const color = `hsla(${(idx * 360 / ROW_COUNT).toFixed(0)} 70% 65% / 0.85)`;
        const span = hist.max - hist.min;
        let brushHtml = "";
        if (flt && Number.isFinite(hist.min) && span > 0) {
          const lo = clamp((flt.lo - hist.min) / span, 0, 1) * 100;
          const hi = clamp((flt.hi - hist.min) / span, 0, 1) * 100;
          const brushStyle = "left:" + lo.toFixed(2) + "%;width:" + (hi - lo).toFixed(2) + "%";
          brushHtml = `<span class="brush" style="${brushStyle}"></span>`;
        }
        const fltText = flt ? `· ${flt.lo.toFixed(2)}…${flt.hi.toFixed(2)} <span class="clearx" data-action="clear">✕</span>` : "";
        card.innerHTML = `<div class="lbl"><span>${idx + 1}</span><b>${escapeHtml(ch)}</b><span>${spec.mode}</span></div><div class="hist">${histogramSvg(hist, color)}${brushHtml}</div><div class="meta"><span>μ=${hist.mean.toFixed(2)} σ=${hist.std.toFixed(2)} [${hist.min.toFixed(2)},${hist.max.toFixed(2)}]</span><span>${fltText}</span></div>`;
        card.title = `${ch}\nmin=${hist.min.toFixed(4)}\nmax=${hist.max.toFixed(4)}\nmean=${hist.mean.toFixed(4)}\nstd=${hist.std.toFixed(4)}\n\nClick: set plot channel\nShift+click: set heat channel\nDrag on histogram: filter range`;
        const histArea = card.querySelector(".hist");
        const clearAction = card.querySelector('[data-action="clear"]');
        if (clearAction) {
          clearAction.addEventListener("click", (ev) => {
            ev.stopPropagation();
            atlasFilters.delete(ch);
            updateAtlasFilterStatus();
            refreshChannelAtlas();
            renderCurrent();
          });
        }
        if (histArea) {
          histArea.addEventListener("mousedown", (ev) => {
            if (ev.button !== 0) return;
            ev.preventDefault();
            ev.stopPropagation();
            const rect = histArea.getBoundingClientRect();
            atlasBrushing = { ch, rect, startX: ev.clientX, hist };
          });
        }
        card.addEventListener("click", (ev) => {
          if (atlasBrushing) return;
          if (ev.target.closest && ev.target.closest('[data-action="clear"]')) return;
          if (ev.shiftKey && ui.deltaChannel) {
            const opts = Array.from(ui.deltaChannel.options).map((o) => o.value);
            if (opts.includes(ch)) {
              ui.deltaChannel.value = ch;
              renderCurrent();
              showToast(`Heat channel = ${ch}`, "ok");
            } else {
              showToast(`'${ch}' not in heat channel list`, "warn");
            }
            return;
          }
          if (ui.plotChannel) {
            ui.plotChannel.value = ch;
            updateEntityInspector();
            showToast(`Plot channel = ${ch}`, "ok");
          }
          refreshChannelAtlas();
        });
        frag.appendChild(card);
      });
      ui.channelAtlas.innerHTML = "";
      ui.channelAtlas.appendChild(frag);
      if (ui.atlasOutlierChannel) {
        const cur = ui.atlasOutlierChannel.value;
        ui.atlasOutlierChannel.innerHTML = "";
        for (const spec of activeIr.schema) {
          const opt = document.createElement("option");
          opt.value = spec.name;
          opt.textContent = spec.name;
          ui.atlasOutlierChannel.appendChild(opt);
        }
        if (cur && activeIr.schema.some((s) => s.name === cur)) ui.atlasOutlierChannel.value = cur;
      }
      updateAtlasFilterStatus();
      refreshRenameDropdown();
    }
    function updateAtlasFilterStatus() {
      if (!ui.atlasFilterStatus) return;
      if (!atlasFilters.size) {
        ui.atlasFilterStatus.textContent = "no filter";
        return;
      }
      const parts = [];
      for (const [ch, r] of atlasFilters) parts.push(`${ch} ∈ [${r.lo.toFixed(2)}, ${r.hi.toFixed(2)}]`);
      const activeIr = previewIr || ir;
      const ids = atlasMatchingIds(activeIr);
      const total = activeIr ? activeIr.entities.length : 0;
      const pct = total ? ((ids.length / total) * 100).toFixed(1) : "0.0";
      ui.atlasFilterStatus.textContent = `${parts.join(" ∧ ")} · ${ids.length}/${total} (${pct}%)`;
    }
    function atlasMatchingIds(activeIr) {
      if (!activeIr) return [];
      if (!atlasFilters.size) return activeIr.entities.map((e) => e.id);
      const ids = [];
      for (const e of activeIr.entities) {
        let ok = true;
        for (const [ch, r] of atlasFilters) {
          const v = ensureFinite(e[ch]);
          if (v < r.lo || v > r.hi) { ok = false; break; }
        }
        if (ok) ids.push(e.id);
      }
      return ids;
    }
    function atlasOutlierIds(activeIr) {
      if (!ui.atlasOutliers || !ui.atlasOutliers.checked) return null;
      if (!activeIr) return null;
      const ch = ui.atlasOutlierChannel ? ui.atlasOutlierChannel.value : null;
      if (!ch || !activeIr.schema.some((s) => s.name === ch)) return null;
      const sigma = numInput(ui.atlasOutlierSigma, 0.1, 12, 2.5);
      const values = activeIr.entities.map((e) => ensureFinite(e[ch]));
      const stats = buildHistogram(values, 8);
      const ids = [];
      for (const e of activeIr.entities) {
        const v = ensureFinite(e[ch]);
        if (Math.abs(v - stats.mean) > sigma * stats.std) ids.push(e.id);
      }
      return { ids, channel: ch, sigma, stats };
    }
    function bindAtlasBrush() {
      window.addEventListener("mousemove", (ev) => {
        if (!atlasBrushing) return;
        const card = ui.channelAtlas.querySelector(`.channel-card[data-channel="${atlasBrushing.ch}"]`);
        if (!card) return;
        const histEl = card.querySelector(".hist");
        if (!histEl) return;
        const rect = atlasBrushing.rect;
        const x1 = clamp(atlasBrushing.startX - rect.left, 0, rect.width);
        const x2 = clamp(ev.clientX - rect.left, 0, rect.width);
        const lo = Math.min(x1, x2) / rect.width;
        const hi = Math.max(x1, x2) / rect.width;
        let brush = histEl.querySelector(".brush");
        if (!brush) {
          brush = document.createElement("span");
          brush.className = "brush";
          histEl.appendChild(brush);
        }
        brush.style.left = (lo * 100).toFixed(2) + "%";
        brush.style.width = ((hi - lo) * 100).toFixed(2) + "%";
      });
      window.addEventListener("mouseup", (ev) => {
        if (!atlasBrushing) return;
        const rect = atlasBrushing.rect;
        const hist = atlasBrushing.hist;
        const ch = atlasBrushing.ch;
        const x1 = clamp(atlasBrushing.startX - rect.left, 0, rect.width);
        const x2 = clamp(ev.clientX - rect.left, 0, rect.width);
        const span = hist.max - hist.min;
        if (Math.abs(x2 - x1) < 4 || span <= 0) {
          atlasBrushing = null;
          refreshChannelAtlas();
          return;
        }
        const a = Math.min(x1, x2) / rect.width;
        const b = Math.max(x1, x2) / rect.width;
        const lo = hist.min + a * span;
        const hi = hist.min + b * span;
        atlasFilters.set(ch, { lo, hi });
        atlasBrushing = null;
        refreshChannelAtlas();
        renderCurrent();
        showToast(`Filter ${ch} ∈ [${lo.toFixed(2)}, ${hi.toFixed(2)}]`, "ok");
      });
    }
    function atlasStatsTsv() {
      const activeIr = previewIr || ir;
      if (!activeIr) return "";
      const out = ["channel\tmin\tmax\tmean\tstd"];
      activeIr.schema.forEach((spec) => {
        const values = activeIr.entities.map((e) => ensureFinite(e[spec.name]));
        const h = buildHistogram(values, 8);
        out.push(`${spec.name}\t${h.min.toFixed(4)}\t${h.max.toFixed(4)}\t${h.mean.toFixed(4)}\t${h.std.toFixed(4)}`);
      });
      return out.join("\n");
    }

    function snapshotsToJsonPayload() {
      const arr = [];
      for (const [name, snap] of snapshots) {
        arr.push({ name, savedAt: snap.savedAt, ir: snap.ir });
      }
      return JSON.stringify({ v: 1, snapshots: arr, exportedAt: new Date().toISOString() });
    }
    function persistSnapshots(silent) {
      const json = snapshotsToJsonPayload();
      if (json.length > MAX_SNAPSHOT_STORAGE_BYTES) {
        if (!silent) showToast("Snapshot storage limit exceeded.", "error");
        return false;
      }
      const ok = safeLocalSet(LS_SNAPSHOTS_KEY, json);
      if (!ok && !silent) showToast("Snapshot save failed (storage quota?).", "error");
      return ok;
    }
    function loadSnapshotsFromStorage() {
      snapshots.clear();
      const raw = safeLocalGet(LS_SNAPSHOTS_KEY);
      if (!raw) return;
      const data = safeJsonParse(raw);
      if (!data || !Array.isArray(data.snapshots)) return;
      for (const item of data.snapshots) {
        if (!item || typeof item.name !== "string") continue;
        if (snapshots.size >= MAX_SNAPSHOT_COUNT) break;
        try {
          validateIrShape(item.ir);
          const name = item.name.slice(0, MAX_SNAPSHOT_NAME_LEN);
          snapshots.set(name, { savedAt: item.savedAt || new Date().toISOString(), ir: snapshotIr(item.ir) });
        } catch (_) { /* skip invalid */ }
      }
    }
    function snapshotMetaText() {
      const sizeBytes = new Blob([snapshotsToJsonPayload()]).size;
      return `${snapshots.size}/${MAX_SNAPSHOT_COUNT} snapshots · ${(sizeBytes / 1024).toFixed(1)}/${(MAX_SNAPSHOT_STORAGE_BYTES / 1024).toFixed(0)} KiB`;
    }
    function refreshSnapshotList() {
      if (!ui.snapshotList) return;
      ui.snapshotList.innerHTML = "";
      if (ui.snapshotMeta) ui.snapshotMeta.textContent = snapshotMetaText();
      if (!snapshots.size) {
        const div = document.createElement("div");
        div.className = "small";
        div.style.color = "var(--muted)";
        div.textContent = "No snapshots yet. Compile IR and save one.";
        ui.snapshotList.appendChild(div);
        return;
      }
      const sorted = Array.from(snapshots.entries()).sort((a, b) => (b[1].savedAt || "").localeCompare(a[1].savedAt || ""));
      for (const [name, snap] of sorted) {
        const row = document.createElement("div");
        row.className = "snapshot-row";
        const ents = snap.ir.entities.length;
        const cps = Array.isArray(snap.ir.meta?.phase3Checkpoints) ? snap.ir.meta.phase3Checkpoints.length : 0;
        row.innerHTML = `<div><div class="name">${escapeHtml(name)}</div><div class="sub">${ents} ents · ${cps} cp · ${escapeHtml((snap.savedAt || "").slice(0, 19))}</div></div>`;
        const btnLoad = document.createElement("button");
        btnLoad.textContent = "Load";
        btnLoad.title = "Replace current IR with this snapshot";
        btnLoad.addEventListener("click", () => {
          ir = snapshotIr(snap.ir);
          previewIr = null;
          schema = ir.schema.map((s) => ({ ...s }));
          updatePlotChannelOptions();
          updateCheckpointUi();
          renderCurrent();
          showToast(`Loaded snapshot "${name}".`, "ok");
        });
        const btnPreview = document.createElement("button");
        btnPreview.textContent = "Preview";
        btnPreview.title = "Set as preview IR (use 'Use Current IR' to exit)";
        btnPreview.addEventListener("click", () => {
          previewIr = snapshotIr(snap.ir);
          renderCurrent();
          showToast(`Previewing snapshot "${name}".`, "ok");
        });
        const btnDiff = document.createElement("button");
        btnDiff.textContent = "Diff";
        btnDiff.title = "Diff vs current IR";
        btnDiff.addEventListener("click", () => {
          if (!ir) {
            showToast("No current IR.", "warn");
            return;
          }
          try {
            const text = diffIrBrief(snap.ir, ir);
            ui.snapshotDiff.textContent = `Diff (snapshot "${name}" -> current):\n${text || "(no channel-level differences)"}`;
          } catch (e) {
            ui.snapshotDiff.textContent = `Diff failed: ${e.message || e}`;
          }
        });
        const btnExport = document.createElement("button");
        btnExport.textContent = "Export";
        btnExport.title = "Download this snapshot as IR JSON";
        btnExport.addEventListener("click", () => {
          download(`svg42_snapshot_${name.replace(/[^A-Za-z0-9_-]+/g, "_")}.json`, JSON.stringify(snap.ir, null, 2), "application/json");
        });
        const btnDelete = document.createElement("button");
        btnDelete.textContent = "✕";
        btnDelete.title = "Delete";
        btnDelete.addEventListener("click", () => {
          if (!confirm(`Delete snapshot "${name}"?`)) return;
          snapshots.delete(name);
          persistSnapshots(true);
          refreshSnapshotList();
          showToast(`Deleted "${name}".`, "ok");
        });
        row.appendChild(btnLoad);
        row.appendChild(btnPreview);
        row.appendChild(btnDiff);
        row.appendChild(btnExport);
        row.appendChild(btnDelete);
        ui.snapshotList.appendChild(row);
      }
    }
    function saveCurrentSnapshot() {
      if (!ir) {
        showToast("Compile IR first.", "warn");
        return;
      }
      let name = (ui.snapshotName.value || "").trim().slice(0, MAX_SNAPSHOT_NAME_LEN);
      if (!name) name = `snap-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}`;
      if (!/^[A-Za-z0-9_\- .]+$/.test(name)) {
        showToast("Snapshot name has invalid chars.", "error");
        return;
      }
      if (snapshots.size >= MAX_SNAPSHOT_COUNT && !snapshots.has(name)) {
        showToast(`Max ${MAX_SNAPSHOT_COUNT} snapshots reached.`, "error");
        return;
      }
      snapshots.set(name, { savedAt: new Date().toISOString(), ir: snapshotIr(ir) });
      persistSnapshots(false);
      refreshSnapshotList();
      ui.snapshotName.value = "";
      showToast(`Saved "${name}".`, "ok");
    }
    function importSnapshotsPayload(parsed, replaceAll) {
      if (!parsed || !Array.isArray(parsed.snapshots)) {
        showToast("Invalid snapshots file.", "error");
        return;
      }
      if (replaceAll) snapshots.clear();
      let added = 0;
      for (const item of parsed.snapshots) {
        if (!item || typeof item.name !== "string") continue;
        if (snapshots.size >= MAX_SNAPSHOT_COUNT) break;
        try {
          validateIrShape(item.ir);
          const name = item.name.slice(0, MAX_SNAPSHOT_NAME_LEN);
          snapshots.set(name, { savedAt: item.savedAt || new Date().toISOString(), ir: snapshotIr(item.ir) });
          added += 1;
        } catch (_) { /* skip */ }
      }
      persistSnapshots(false);
      refreshSnapshotList();
      showToast(`Imported ${added} snapshot(s).`, "ok");
    }

    function rasterizeStageToPng() {
      if (!lastSvg) {
        showToast("No SVG to export.", "warn");
        return;
      }
      const svgString = lastSvg.startsWith("<svg") ? lastSvg : (ui.stage.querySelector("svg")?.outerHTML || "");
      if (!svgString) {
        showToast("No SVG element found.", "warn");
        return;
      }
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const scale = 1.5;
          canvas.width = STAGE_VIEW_W * scale;
          canvas.height = STAGE_VIEW_H * scale;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#080d14";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (!blob) {
              URL.revokeObjectURL(url);
              showToast("PNG encode failed.", "error");
              return;
            }
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `svg42_${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(a.href);
            URL.revokeObjectURL(url);
            showToast("PNG downloaded.", "ok");
          }, "image/png");
        } catch (e) {
          URL.revokeObjectURL(url);
          showToast(`PNG export failed: ${e.message || e}`, "error");
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        showToast("PNG export failed (image load).", "error");
      };
      img.src = url;
    }

    function buildHelpDrawerHtml() {
      return `
        <h3>DSL — schema (42 rows)</h3>
        <p class="small">Format: <code>rowIndex name min max mode</code>. Modes: <code>linear</code>, <code>wrap360</code>, <code>clamp01</code>, <code>enum</code>. Names must match <code>/^[A-Za-z_][A-Za-z0-9_]{0,31}$/</code>.</p>
        <h3>Phase 2 ops</h3>
        <table>
          <tr><th>op</th><th>example</th><th>notes</th></tr>
          <tr><td><code>entities</code></td><td>entities 200</td><td>1..${MAX_ENTITIES}</td></tr>
          <tr><td><code>preset</code></td><td>preset mandala</td><td>swarm | mandala | glitch | nebula</td></tr>
          <tr><td><code>set</code></td><td>set hue 180</td><td>row index or channel name</td></tr>
          <tr><td><code>wave</code></td><td>wave x 340 2.7 0</td><td>amp freq phase</td></tr>
          <tr><td><code>noise</code></td><td>noise hue 220</td><td>row index or name</td></tr>
          <tr><td><code>quantize</code></td><td>quantize rot 24</td><td>steps ≥ 1</td></tr>
          <tr><td><code>mirror</code></td><td>mirror x 0</td><td>around center</td></tr>
        </table>
        <h3>Phase 3 ops</h3>
        <table>
          <tr><th>op</th><th>signature</th><th>notes</th></tr>
          <tr><td><code>clamp</code></td><td>clamp ch min max</td><td>per-entity clamp</td></tr>
          <tr><td><code>gain</code></td><td>gain ch factor</td><td>multiplicative</td></tr>
          <tr><td><code>bias</code></td><td>bias ch offset</td><td>additive</td></tr>
          <tr><td><code>sort</code></td><td>sort ch asc|desc</td><td>reorders entities</td></tr>
          <tr><td><code>shuffle</code></td><td>shuffle seed</td><td>mulberry32</td></tr>
          <tr><td><code>quantize</code></td><td>quantize ch steps</td><td>steps ≥ 1</td></tr>
          <tr><td><code>smooth</code></td><td>smooth ch window</td><td>moving avg, w 1..20</td></tr>
          <tr><td><code>lerp</code></td><td>lerp ch target t</td><td>t in 0..1</td></tr>
          <tr><td><code>randomize</code></td><td>randomize ch lo hi [seed]</td><td>uniform</td></tr>
          <tr><td><code>swirl</code></td><td>swirl angleDeg</td><td>rotate (x, y)</td></tr>
          <tr><td><code>abs</code></td><td>abs ch</td><td>per-entity</td></tr>
          <tr><td><code>power</code></td><td>power ch p</td><td>signed p exponent</td></tr>
          <tr><td><code>step</code></td><td>step ch t lo hi</td><td>binary threshold</td></tr>
          <tr><td><code>invert</code></td><td>invert ch</td><td>min↔max around span</td></tr>
          <tr><td><code>normalize</code></td><td>normalize ch outMin outMax</td><td>linear remap</td></tr>
          <tr><td><code>macro</code></td><td>macro name</td><td>${Object.keys(PHASE3_MACROS).map((m) => `<code>${m}</code>`).join(", ")}</td></tr>
        </table>
        <h3>Tips</h3>
        <ul class="small" style="margin:4px 0 4px 18px">
          <li>Click a card in <em>Channel Atlas</em> to set the plot channel; <kbd>Shift</kbd>+click to set the heat channel.</li>
          <li>Use the <em>Snapshot Library</em> to keep multiple IRs (e.g. before/after Phase 3) and diff between them.</li>
          <li>Drag on stage to pan, <kbd>wheel</kbd> to zoom, <kbd>Shift</kbd>+drag to pin entities in a rectangle, <kbd>Alt</kbd>+drag to unpin.</li>
          <li>Press <kbd>Space</kbd> to play/pause the timeline. Toggle <em>Overlays follow t</em> to move the heat/pin overlays with time.</li>
        </ul>`;
    }
    function buildCheatsheetHtml() {
      const items = [
        ["?", "Toggle this cheatsheet"],
        ["Space", "Play / pause timeline"],
        ["= or 0", "Reset stage view (zoom + pan)"],
        ["+ / -", "Zoom in / out"],
        ["g", "Focus 'Jump #' input"],
        ["c", "Copy inspector text"],
        ["p / Shift+p", "Pin / unpin selected"],
        ["j / ]", "Next checkpoint"],
        ["k / [", "Prev checkpoint"],
        ["← / , and → / .", "Prev / next entity"],
        ["r", "Random entity"],
        ["s", "Save snapshot of current IR"],
        ["Esc", "Clear jump ring & close cheatsheet"]
      ];
      const dl = items.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join("");
      return `<span class="close-x" id="cheatClose" title="Close">✕</span><h3>Hotkeys</h3><dl>${dl}</dl><p class="small" style="color:var(--muted);margin:4px 0 0">Hotkeys are ignored when typing in inputs/textareas.</p>`;
    }
    function toggleCheatsheet(force) {
      cheatsheetOpen = (force === true) ? true : (force === false ? false : !cheatsheetOpen);
      if (!ui.cheatsheetPopover) return;
      ui.cheatsheetPopover.classList.toggle("open", cheatsheetOpen);
      if (cheatsheetOpen) {
        ui.cheatsheetPopover.innerHTML = buildCheatsheetHtml();
        const close = ui.cheatsheetPopover.querySelector("#cheatClose");
        if (close) close.addEventListener("click", () => toggleCheatsheet(false));
      }
    }
    function toggleHelpDrawer(force) {
      if (!ui.helpDrawer) return;
      const open = (force === true) ? true : (force === false ? false : !ui.helpDrawer.classList.contains("open"));
      if (open && !ui.helpDrawer.dataset.populated) {
        ui.helpDrawer.innerHTML = buildHelpDrawerHtml();
        ui.helpDrawer.dataset.populated = "1";
      }
      ui.helpDrawer.classList.toggle("open", open);
      if (ui.btnHelpDrawer) ui.btnHelpDrawer.textContent = open ? "Hide docs" : "Docs";
    }

    function focusedIsTextual() {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName ? el.tagName.toLowerCase() : "";
      return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
    }
    function bindStageInteractions() {
      ui.stage.addEventListener("wheel", (ev) => {
        if (!ev.ctrlKey && !ev.shiftKey && !ev.altKey) {
          if (Math.abs(ev.deltaY) < 1) return;
        }
        ev.preventDefault();
        const factor = ev.deltaY > 0 ? 0.9 : 1.1;
        const next = clamp(stageZoom * factor, STAGE_ZOOM_MIN, STAGE_ZOOM_MAX);
        const stageRect = ui.stage.getBoundingClientRect();
        const cx = ev.clientX - stageRect.left;
        const cy = ev.clientY - stageRect.top;
        stagePanX = cx - ((cx - stagePanX) * (next / stageZoom));
        stagePanY = cy - ((cy - stagePanY) * (next / stageZoom));
        stageZoom = next;
        applyStageTransform();
      }, { passive: false });
      ui.stage.addEventListener("mousedown", (ev) => {
        if (ev.button !== 0) return;
        if (ev.shiftKey || ev.altKey) {
          ev.preventDefault();
          startStageBrush(ev);
          return;
        }
        if (ev.target && ev.target.closest && ev.target.closest("[data-eid]")) return;
        startStagePan(ev);
      });
      window.addEventListener("mousemove", (ev) => {
        if (stagePanning) moveStagePan(ev);
        if (stageBrushing) moveStageBrush(ev);
      });
      window.addEventListener("mouseup", (ev) => {
        if (stagePanning) endStagePan();
        if (stageBrushing) {
          const mod = ev.altKey ? "remove" : (ev.ctrlKey ? "select" : "add");
          endStageBrush(ev, mod);
        }
      });
      ui.stage.classList.add("is-pannable");
    }

    const SEARCH_OPS = ["==", "!=", ">=", "<=", ">", "<"];
    function tokenizeSearchExpr(expr) {
      const out = [];
      let i = 0;
      const s = String(expr || "");
      const isWord = (c) => /[A-Za-z0-9_.\-]/.test(c);
      while (i < s.length) {
        const c = s[i];
        if (c === " " || c === "\t") { i += 1; continue; }
        if (c === "(" || c === ")") { out.push({ kind: c }); i += 1; continue; }
        if (c === "&" && s[i + 1] === "&") { out.push({ kind: "and" }); i += 2; continue; }
        if (c === "|" && s[i + 1] === "|") { out.push({ kind: "or" }); i += 2; continue; }
        if (s.slice(i, i + 3).toLowerCase() === "and" && !isWord(s[i + 3] || "")) { out.push({ kind: "and" }); i += 3; continue; }
        if (s.slice(i, i + 2).toLowerCase() === "or" && !isWord(s[i + 2] || "")) { out.push({ kind: "or" }); i += 2; continue; }
        let matched = "";
        for (const op of SEARCH_OPS) {
          if (s.slice(i, i + op.length) === op) { matched = op; break; }
        }
        if (matched) { out.push({ kind: "op", op: matched }); i += matched.length; continue; }
        if (isWord(c)) {
          let j = i;
          while (j < s.length && isWord(s[j])) j += 1;
          out.push({ kind: "word", value: s.slice(i, j) });
          i = j;
          continue;
        }
        throw new Error(`Unexpected char "${c}" in predicate.`);
      }
      return out;
    }
    function compileSearchPredicate(expr, channelSet) {
      const tokens = tokenizeSearchExpr(expr);
      let pos = 0;
      const peek = () => tokens[pos];
      const eat = () => tokens[pos++];
      function parseAtom() {
        const tk = eat();
        if (!tk) throw new Error("Expected predicate.");
        if (tk.kind === "(") {
          const inner = parseOr();
          const close = eat();
          if (!close || close.kind !== ")") throw new Error("Missing ')'.");
          return inner;
        }
        if (tk.kind !== "word") throw new Error("Expected channel name.");
        const ch = tk.value.toLowerCase();
        if (!channelSet.has(ch)) throw new Error(`Unknown channel "${tk.value}".`);
        const opTok = eat();
        if (!opTok || opTok.kind !== "op") throw new Error(`Expected operator after "${tk.value}".`);
        const valTok = eat();
        if (!valTok || valTok.kind !== "word") throw new Error("Expected numeric value.");
        const v = Number(valTok.value);
        if (!Number.isFinite(v)) throw new Error(`Invalid number "${valTok.value}".`);
        const op = opTok.op;
        return (entity) => {
          const lhs = ensureFinite(entity[ch]);
          if (op === ">") return lhs > v;
          if (op === "<") return lhs < v;
          if (op === ">=") return lhs >= v;
          if (op === "<=") return lhs <= v;
          if (op === "==") return Math.abs(lhs - v) < 1e-9;
          if (op === "!=") return Math.abs(lhs - v) >= 1e-9;
          return false;
        };
      }
      function parseAnd() {
        let left = parseAtom();
        while (peek() && peek().kind === "and") {
          eat();
          const right = parseAtom();
          const a = left;
          left = (e) => a(e) && right(e);
        }
        return left;
      }
      function parseOr() {
        let left = parseAnd();
        while (peek() && peek().kind === "or") {
          eat();
          const right = parseAnd();
          const a = left;
          left = (e) => a(e) || right(e);
        }
        return left;
      }
      const fn = parseOr();
      if (pos !== tokens.length) throw new Error("Trailing tokens after predicate.");
      return fn;
    }
    function runPredicateSearch(expr) {
      const activeIr = previewIr || ir;
      if (!activeIr) {
        ui.searchStatus.innerHTML = '<span class="warn">Compile IR first.</span>';
        return [];
      }
      const channels = new Set(activeIr.schema.map((s) => s.name.toLowerCase()));
      try {
        const fn = compileSearchPredicate(expr, channels);
        const ids = [];
        for (const e of activeIr.entities) if (fn(e)) ids.push(e.id);
        lastSearchIds = ids;
        ui.searchStatus.innerHTML = `<span class="ok">Match:</span> ${ids.length}/${activeIr.entities.length}`;
        const preview = ids.slice(0, 30).map((id) => `#${id}`).join(", ");
        ui.searchResults.textContent = ids.length ? `${preview}${ids.length > 30 ? `, … (+${ids.length - 30})` : ""}` : "(none)";
        return ids;
      } catch (e) {
        ui.searchStatus.innerHTML = `<span class="danger">${escapeHtml(e.message || String(e))}</span>`;
        ui.searchResults.textContent = "";
        lastSearchIds = [];
        return [];
      }
    }

    function customMacrosSerialize() {
      const out = {};
      for (const [k, v] of customMacros) out[k] = { body: v.body, savedAt: v.savedAt };
      return JSON.stringify({ v: 1, macros: out });
    }
    function persistCustomMacros() {
      const ok = safeLocalSet(LS_CUSTOM_MACROS_KEY, customMacrosSerialize());
      if (!ok) showToast("Macro save failed (storage quota?).", "error");
    }
    function loadCustomMacros() {
      customMacros.clear();
      const raw = safeLocalGet(LS_CUSTOM_MACROS_KEY);
      if (!raw) return;
      const data = safeJsonParse(raw);
      if (!data || !data.macros) return;
      for (const [name, val] of Object.entries(data.macros)) {
        if (customMacros.size >= MAX_CUSTOM_MACROS) break;
        if (typeof name !== "string" || typeof val !== "object" || typeof val.body !== "string") continue;
        const cleanName = name.toLowerCase().slice(0, 32);
        if (!/^[a-z0-9_\-]+$/.test(cleanName)) continue;
        customMacros.set(cleanName, { body: val.body.slice(0, MAX_CUSTOM_MACRO_BYTES), savedAt: val.savedAt || new Date().toISOString() });
      }
    }
    function refreshCustomMacroUi() {
      if (!ui.customMacroSelect) return;
      ui.customMacroSelect.innerHTML = "";
      const keys = Array.from(customMacros.keys()).sort();
      if (!keys.length) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "(no custom macros)";
        ui.customMacroSelect.appendChild(opt);
      } else {
        for (const k of keys) {
          const opt = document.createElement("option");
          opt.value = k;
          opt.textContent = k;
          ui.customMacroSelect.appendChild(opt);
        }
      }
      if (ui.customMacroCount) ui.customMacroCount.textContent = `${customMacros.size}/${MAX_CUSTOM_MACROS}`;
    }
    function saveCustomMacro() {
      const name = (ui.customMacroName.value || "").trim().toLowerCase();
      if (!name) { showToast("Macro name required.", "warn"); return; }
      if (!/^[a-z0-9_\-]+$/.test(name) || name.length > 32) { showToast("Bad macro name (a-z, 0-9, _ -).", "error"); return; }
      if (PHASE3_MACROS[name]) { showToast(`"${name}" is a built-in macro name.`, "error"); return; }
      const body = (ui.customMacroBody.value || "").slice(0, MAX_CUSTOM_MACRO_BYTES);
      if (!body.trim()) { showToast("Macro body empty.", "warn"); return; }
      try {
        const lines = parseCustomMacroBody(body);
        if (!lines.length) throw new Error("No effective passes.");
      } catch (e) {
        showToast(`Macro parse failed: ${e.message || e}`, "error");
        return;
      }
      if (customMacros.size >= MAX_CUSTOM_MACROS && !customMacros.has(name)) {
        showToast(`Max ${MAX_CUSTOM_MACROS} macros reached.`, "error");
        return;
      }
      customMacros.set(name, { body, savedAt: new Date().toISOString() });
      persistCustomMacros();
      refreshCustomMacroUi();
      ui.customMacroSelect.value = name;
      ui.customMacroStatus.innerHTML = `<span class="ok">Saved macro "${escapeHtml(name)}".</span>`;
    }
    function loadSelectedCustomMacro() {
      const name = ui.customMacroSelect.value;
      if (!name || !customMacros.has(name)) return;
      ui.customMacroName.value = name;
      ui.customMacroBody.value = customMacros.get(name).body;
      ui.customMacroStatus.innerHTML = `<span class="ok">Loaded "${escapeHtml(name)}".</span>`;
    }
    function deleteSelectedCustomMacro() {
      const name = ui.customMacroSelect.value;
      if (!name || !customMacros.has(name)) return;
      if (!confirm(`Delete macro "${name}"?`)) return;
      customMacros.delete(name);
      persistCustomMacros();
      refreshCustomMacroUi();
      ui.customMacroStatus.innerHTML = `<span class="warn">Deleted.</span>`;
    }
    function insertSelectedCustomMacro() {
      const name = ui.customMacroSelect.value;
      if (!name || !customMacros.has(name)) return;
      const cur = ui.phase3Input.value;
      const sep = (cur.endsWith("\n") || !cur.length) ? "" : "\n";
      ui.phase3Input.value = cur + sep + `macro ${name}\n`;
      ui.customMacroStatus.innerHTML = `<span class="ok">Appended to Phase 3.</span>`;
    }

    function dryRunPhase3Line() {
      if (!ir) { ui.phase3DryStatus.textContent = "Compile IR first."; return; }
      const line = (ui.phase3DryLine.value || "").trim();
      if (!line) { ui.phase3DryStatus.textContent = "Type a single Phase 3 line."; return; }
      try {
        const before = applyPhase3Pipeline(ir, "");
        const after = applyPhase3Pipeline(ir, line);
        const text = diffIrBrief(before, after);
        ui.phase3DryStatus.textContent = `'${line}' -> ${text || "(no measurable change)"}`;
      } catch (e) {
        ui.phase3DryStatus.textContent = `Error: ${e.message || e}`;
      }
    }
    function dryRunPhase3Append() {
      const line = (ui.phase3DryLine.value || "").trim();
      if (!line) { ui.phase3DryStatus.textContent = "Type a Phase 3 line."; return; }
      const cur = ui.phase3Input.value;
      const sep = (cur.endsWith("\n") || !cur.length) ? "" : "\n";
      ui.phase3Input.value = cur + sep + line + "\n";
      if (macroRecording) recordMacroLine(line);
      compileAndReport();
      showToast("Appended Phase 3 line and recompiled.", "ok");
    }
    function dryRunPhase2Line() {
      if (!ui.phase2DryStatus) return;
      const line = (ui.phase2DryLine && ui.phase2DryLine.value || "").trim();
      if (!line) { ui.phase2DryStatus.textContent = "Type a single Phase 2 line."; return; }
      try {
        const baseScript = ui.phase2Input.value || "";
        const before = compilePhase2Script(baseScript, ui.seed.value);
        const sep = (baseScript.endsWith("\n") || !baseScript.length) ? "" : "\n";
        const candidate = baseScript + sep + line + "\n";
        const after = compilePhase2Script(candidate, ui.seed.value);
        const beforeRows = before.split(/\r?\n/).filter(Boolean).map(parseNumericRow);
        const afterRows = after.split(/\r?\n/).filter(Boolean).map(parseNumericRow);
        const activeSchema = (Array.isArray(schema) && schema.length === ROW_COUNT) ? schema : parseDsl(DEFAULT_DSL);
        const changes = [];
        for (let r = 0; r < ROW_COUNT; r += 1) {
          const a = beforeRows[r] || [];
          const b = afterRows[r] || [];
          const n = Math.min(a.length, b.length);
          if (!n) continue;
          let absSum = 0;
          let nonzero = 0;
          let mxBefore = -Infinity, mnBefore = Infinity;
          let mxAfter = -Infinity, mnAfter = Infinity;
          let sumBefore = 0, sumAfter = 0;
          for (let i = 0; i < n; i += 1) {
            const av = ensureFinite(a[i]);
            const bv = ensureFinite(b[i]);
            const d = bv - av;
            if (Math.abs(d) > 1e-9) {
              nonzero += 1;
              absSum += Math.abs(d);
            }
            if (av < mnBefore) mnBefore = av;
            if (av > mxBefore) mxBefore = av;
            if (bv < mnAfter) mnAfter = bv;
            if (bv > mxAfter) mxAfter = bv;
            sumBefore += av;
            sumAfter += bv;
          }
          if (nonzero) {
            changes.push({
              channel: activeSchema[r] ? activeSchema[r].name : `row${r}`,
              touched: nonzero,
              meanAbsDelta: absSum / nonzero,
              dMean: (sumAfter - sumBefore) / n,
              rangeBefore: [mnBefore, mxBefore],
              rangeAfter: [mnAfter, mxAfter]
            });
          }
        }
        if (!changes.length) {
          ui.phase2DryStatus.textContent = `'${line}' -> (no measurable change)`;
          return;
        }
        changes.sort((p, q) => q.touched - p.touched);
        const top = changes.slice(0, 6).map((c) =>
          `${c.channel}: touched ${c.touched}, |Δ|=${c.meanAbsDelta.toFixed(3)} dμ=${c.dMean.toFixed(3)} [${c.rangeBefore[0].toFixed(2)},${c.rangeBefore[1].toFixed(2)}] → [${c.rangeAfter[0].toFixed(2)},${c.rangeAfter[1].toFixed(2)}]`
        ).join("\n");
        ui.phase2DryStatus.textContent = `'${line}' -> changed ${changes.length} channel(s)\n${top}`;
      } catch (e) {
        ui.phase2DryStatus.textContent = `Error: ${e.message || e}`;
      }
    }
    function refreshRenameDropdown() {
      if (!ui.renameChannelFrom) return;
      const cur = ui.renameChannelFrom.value;
      const activeIr = previewIr || ir;
      const list = (activeIr && Array.isArray(activeIr.schema)) ? activeIr.schema.map((s) => s.name) : (Array.isArray(schema) ? schema.map((s) => s.name) : []);
      ui.renameChannelFrom.innerHTML = "";
      for (const name of list) {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        ui.renameChannelFrom.appendChild(opt);
      }
      if (cur && list.includes(cur)) ui.renameChannelFrom.value = cur;
    }
    function isValidChannelName(name) {
      return /^[A-Za-z][A-Za-z0-9_]*$/.test(name);
    }
    function renameInDsl(text, oldName, newName) {
      const lines = text.split(/\r?\n/);
      const out = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) { out.push(line); continue; }
        const tokens = line.split(/\s+/).filter(Boolean);
        if (tokens.length >= 2 && tokens[1] === oldName) {
          tokens[1] = newName;
          out.push(tokens.join(" "));
        } else {
          out.push(line);
        }
      }
      return out.join("\n");
    }
    function renameTokenInScript(text, oldName, newName) {
      const lines = text.split(/\r?\n/);
      const re = new RegExp(`\\b${oldName.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\b`, "g");
      const out = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) { out.push(line); continue; }
        out.push(line.replace(re, newName));
      }
      return out.join("\n");
    }
    function renameChannel() {
      if (!ui.renameStatus) return;
      const oldName = ui.renameChannelFrom ? ui.renameChannelFrom.value : "";
      const newName = (ui.renameChannelTo ? ui.renameChannelTo.value : "").trim();
      if (!oldName) { ui.renameStatus.textContent = "Pick a channel."; return; }
      if (!newName) { ui.renameStatus.textContent = "New name required."; return; }
      if (oldName === newName) { ui.renameStatus.textContent = "Same name."; return; }
      if (!isValidChannelName(newName)) { ui.renameStatus.innerHTML = '<span class="err">Invalid name. Use [A-Za-z][A-Za-z0-9_]*</span>'; return; }
      const existing = (Array.isArray(schema) ? schema.map((s) => s.name) : []);
      if (existing.includes(newName)) { ui.renameStatus.innerHTML = '<span class="err">Name already in use.</span>'; return; }
      const beforeDsl = ui.builderDsl.value;
      const beforeP2 = ui.phase2Input.value;
      const beforeP3 = ui.phase3Input.value;
      try {
        ui.builderDsl.value = renameInDsl(beforeDsl, oldName, newName);
        ui.phase2Input.value = renameTokenInScript(beforeP2, oldName, newName);
        ui.phase3Input.value = renameTokenInScript(beforeP3, oldName, newName);
        const newSchema = parseDsl(ui.builderDsl.value);
        if (!newSchema.some((s) => s.name === newName)) throw new Error("rename did not appear in DSL");
        schema = newSchema;
        if (atlasFilters.has(oldName)) {
          const r = atlasFilters.get(oldName);
          atlasFilters.delete(oldName);
          atlasFilters.set(newName, r);
        }
        if (ui.deltaChannel && ui.deltaChannel.value === oldName) ui.deltaChannel.value = newName;
        if (ui.plotChannel && ui.plotChannel.value === oldName) ui.plotChannel.value = newName;
        if (ui.atlasOutlierChannel && ui.atlasOutlierChannel.value === oldName) ui.atlasOutlierChannel.value = newName;
        if (ui.scatterX && ui.scatterX.value === oldName) ui.scatterX.value = newName;
        if (ui.scatterY && ui.scatterY.value === oldName) ui.scatterY.value = newName;
        if (ui.scatterColor && ui.scatterColor.value === oldName) ui.scatterColor.value = newName;
        if (ui.scatterSize && ui.scatterSize.value === oldName) ui.scatterSize.value = newName;
        if (ui.transferChannel && ui.transferChannel.value === oldName) ui.transferChannel.value = newName;
        if (ui.diffMatrixChannel && ui.diffMatrixChannel.value === oldName) ui.diffMatrixChannel.value = newName;
        compileAndReport();
        refreshRenameDropdown();
        ui.renameChannelTo.value = "";
        ui.renameStatus.innerHTML = `<span class="ok">Renamed ${oldName} → ${newName}.</span>`;
        showToast(`Renamed channel ${oldName} → ${newName}.`, "ok");
      } catch (e) {
        ui.builderDsl.value = beforeDsl;
        ui.phase2Input.value = beforeP2;
        ui.phase3Input.value = beforeP3;
        ui.renameStatus.innerHTML = `<span class="err">Rollback: ${e.message || e}</span>`;
      }
    }
    function dryRunPhase2Append() {
      const line = (ui.phase2DryLine && ui.phase2DryLine.value || "").trim();
      if (!line) { ui.phase2DryStatus.textContent = "Type a Phase 2 line."; return; }
      const cur = ui.phase2Input.value;
      const sep = (cur.endsWith("\n") || !cur.length) ? "" : "\n";
      ui.phase2Input.value = cur + sep + line + "\n";
      if (macroRecording) recordMacroLine("# phase2: " + line);
      try {
        ui.matrixInput.value = compilePhase2Script(ui.phase2Input.value, ui.seed.value);
      } catch (e) {
        showToast("Phase 2 compile failed: " + (e.message || e), "error");
        return;
      }
      compileAndReport();
      showToast("Appended Phase 2 line and recompiled matrix.", "ok");
    }

    function refreshPhase3Timing() {
      if (!ui.phase3Timing) return;
      const cps = ir?.meta?.phase3Checkpoints;
      if (!cps || cps.length < 2) {
        ui.phase3Timing.textContent = "Run Phase 3 with checkpoints to see timing.";
        return;
      }
      const items = cps.slice(1);
      const peak = Math.max(...items.map((c) => c.durationMs || 0), 0.001);
      const lines = items.map((c, idx) => {
        const ms = c.durationMs || 0;
        const w = Math.max(1, Math.round((ms / peak) * 30));
        const bar = "█".repeat(w);
        return `${String(idx + 1).padStart(2, " ")}: ${bar.padEnd(30, " ")} ${ms.toFixed(2)} ms  ${c.label}`;
      });
      const total = items.reduce((s, c) => s + (c.durationMs || 0), 0);
      ui.phase3Timing.textContent = `Total: ${total.toFixed(2)} ms across ${items.length} pass(es)\n${lines.join("\n")}`;
    }

    function pearson(xs, ys) {
      const n = Math.min(xs.length, ys.length);
      if (!n) return 0;
      let sx = 0, sy = 0, count = 0;
      for (let i = 0; i < n; i += 1) {
        const a = xs[i], b = ys[i];
        if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
        sx += a; sy += b; count += 1;
      }
      if (count < 2) return 0;
      const mx = sx / count;
      const my = sy / count;
      let num = 0, dx = 0, dy = 0;
      for (let i = 0; i < n; i += 1) {
        const a = xs[i], b = ys[i];
        if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
        const da = a - mx;
        const db = b - my;
        num += da * db;
        dx += da * da;
        dy += db * db;
      }
      const den = Math.sqrt(dx * dy);
      if (!Number.isFinite(den) || den < 1e-12) return 0;
      const r = num / den;
      return Number.isFinite(r) ? clamp(r, -1, 1) : 0;
    }
    function refreshCorrelation() {
      if (!ui.corrMatrix) return;
      const activeIr = previewIr || ir;
      if (!activeIr) {
        ui.corrMatrix.innerHTML = '<p class="small" style="color:var(--muted)">Compile IR first.</p>';
        return;
      }
      const raw = (ui.corrChannels.value || "").trim();
      const namesAll = activeIr.schema.map((s) => s.name);
      const requested = raw ? raw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean) : ["x", "y", "scale", "hue", "life", "rot"];
      const names = requested.filter((n) => namesAll.includes(n));
      if (names.length < 2) {
        ui.corrMatrix.innerHTML = '<p class="small" style="color:var(--warn)">Need at least 2 valid channels.</p>';
        return;
      }
      const cols = names.map((n) => activeIr.entities.map((e) => ensureFinite(e[n])));
      const cell = 28;
      const labelW = 70;
      const w = labelW + names.length * cell;
      const h = labelW + names.length * cell;
      const lines = [];
      for (let j = 0; j < names.length; j += 1) {
        for (let i = 0; i < names.length; i += 1) {
          const r = pearson(cols[i], cols[j]);
          const x = labelW + i * cell;
          const y = labelW + j * cell;
          const t = (r + 1) / 2;
          const hue = (1 - t) * 220 + t * 0;
          const fill = `hsla(${hue.toFixed(0)} 75% ${(35 + Math.abs(r) * 35).toFixed(0)}% / 0.95)`;
          lines.push(`<rect x="${x}" y="${y}" width="${cell - 1}" height="${cell - 1}" fill="${fill}"/>`);
          if (Math.abs(r) > 0.4) {
            lines.push(`<text x="${x + cell / 2}" y="${y + cell / 2 + 3}" font-size="9" text-anchor="middle" fill="white">${r.toFixed(2)}</text>`);
          }
        }
      }
      const colLabels = names.map((n, i) => `<text x="${labelW + i * cell + cell / 2}" y="${labelW - 6}" font-size="10" text-anchor="middle" fill="currentColor">${escapeHtml(n)}</text>`).join("");
      const rowLabels = names.map((n, j) => `<text x="${labelW - 6}" y="${labelW + j * cell + cell / 2 + 3}" font-size="10" text-anchor="end" fill="currentColor">${escapeHtml(n)}</text>`).join("");
      ui.corrMatrix.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${Math.min(520, w)}" height="${Math.min(520, h)}" style="max-width:100%;height:auto;color:var(--ink)"><rect width="${w}" height="${h}" fill="var(--panel-2)"/>${lines.join("")}${colLabels}${rowLabels}</svg>`;
    }

    function refreshMiniMap() {
      if (!ui.minimap) return;
      if (ui.minimapEnabled && !ui.minimapEnabled.checked) {
        ui.minimap.innerHTML = '<p class="small" style="margin:8px;color:var(--muted)">Mini-map disabled.</p>';
        return;
      }
      const activeIr = previewIr || ir;
      if (!activeIr) {
        ui.minimap.innerHTML = '<p class="small" style="margin:8px;color:var(--muted)">Compile IR first.</p>';
        return;
      }
      const t = overlayTime();
      const w = 300, h = 220;
      const dots = [];
      const cells = 24;
      const cw = w / cells, ch = h / cells;
      const grid = Array.from({ length: cells }, () => new Array(cells).fill(0));
      for (const e of activeIr.entities) {
        const p = entityScreenPos(e, t);
        const nx = clamp(p.x / STAGE_VIEW_W, 0, 1);
        const ny = clamp(p.y / STAGE_VIEW_H, 0, 1);
        const ix = Math.min(cells - 1, Math.floor(nx * cells));
        const iy = Math.min(cells - 1, Math.floor(ny * cells));
        grid[iy][ix] += 1;
        if (pinnedEntityIds.has(e.id)) {
          dots.push(`<circle cx="${(nx * w).toFixed(2)}" cy="${(ny * h).toFixed(2)}" r="2.6" fill="hsla(55 100% 65% / 0.95)"/>`);
        } else {
          dots.push(`<circle cx="${(nx * w).toFixed(2)}" cy="${(ny * h).toFixed(2)}" r="1.4" fill="hsla(190 50% 70% / 0.6)"/>`);
        }
      }
      let peak = 0;
      for (let y = 0; y < cells; y += 1) for (let x = 0; x < cells; x += 1) if (grid[y][x] > peak) peak = grid[y][x];
      const heat = [];
      if (peak > 0) {
        for (let y = 0; y < cells; y += 1) {
          for (let x = 0; x < cells; x += 1) {
            const v = grid[y][x];
            if (!v) continue;
            const a = (v / peak) * 0.45;
            heat.push(`<rect x="${(x * cw).toFixed(2)}" y="${(y * ch).toFixed(2)}" width="${cw.toFixed(2)}" height="${ch.toFixed(2)}" fill="hsla(160 70% 55% / ${a.toFixed(3)})"/>`);
          }
        }
      }
      const stageRect = ui.stage.getBoundingClientRect();
      let viewport = "";
      if (stageRect.width > 0 && stageZoom > 0) {
        const visW = (stageRect.width / stageZoom);
        const visH = (stageRect.height / stageZoom);
        const visX = -stagePanX / stageZoom;
        const visY = -stagePanY / stageZoom;
        const r = {
          x: clamp(visX / STAGE_VIEW_W, 0, 1) * w,
          y: clamp(visY / STAGE_VIEW_H, 0, 1) * h,
          w: clamp(visW / STAGE_VIEW_W, 0, 1.5) * w,
          h: clamp(visH / STAGE_VIEW_H, 0, 1.5) * h
        };
        viewport = `<rect x="${r.x.toFixed(2)}" y="${r.y.toFixed(2)}" width="${r.w.toFixed(2)}" height="${r.h.toFixed(2)}" fill="none" stroke="hsla(190 90% 70% / 0.95)" stroke-width="1.4" stroke-dasharray="4 3"/>`;
      }
      ui.minimap.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="auto" preserveAspectRatio="xMidYMid meet" style="display:block"><rect width="${w}" height="${h}" fill="var(--panel-2)"/>${heat.join("")}${dots.join("")}${viewport}</svg>`;
    }
    function bindMiniMapClick() {
      if (!ui.minimap) return;
      ui.minimap.addEventListener("click", (ev) => {
        const svg = ui.minimap.querySelector("svg");
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        if (rect.width <= 0) return;
        const nx = (ev.clientX - rect.left) / rect.width;
        const ny = (ev.clientY - rect.top) / rect.height;
        const targetX = nx * STAGE_VIEW_W;
        const targetY = ny * STAGE_VIEW_H;
        const stageRect = ui.stage.getBoundingClientRect();
        stagePanX = (stageRect.width / 2) - (targetX * stageZoom);
        stagePanY = (stageRect.height / 2) - (targetY * stageZoom);
        applyStageTransform();
        refreshMiniMap();
        showToast(`Centered on (${targetX.toFixed(0)}, ${targetY.toFixed(0)}).`, "ok");
      });
    }

    function refreshPinToolkit() {
      if (!ui.pinTrimChannel) return;
      const activeIr = previewIr || ir;
      const cur = ui.pinTrimChannel.value;
      ui.pinTrimChannel.innerHTML = "";
      if (!activeIr) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "(no IR)";
        ui.pinTrimChannel.appendChild(opt);
      } else {
        for (const spec of activeIr.schema) {
          const opt = document.createElement("option");
          opt.value = spec.name;
          opt.textContent = spec.name;
          ui.pinTrimChannel.appendChild(opt);
        }
        if (cur && Array.from(ui.pinTrimChannel.options).some((o) => o.value === cur)) {
          ui.pinTrimChannel.value = cur;
        }
      }
      if (ui.pinToolkitCount) ui.pinToolkitCount.textContent = `${pinnedEntityIds.size} pinned · ${activeIr ? activeIr.entities.length : 0} entities`;
    }
    function topNIdsByChannel(activeIr, channel, n, dir) {
      if (!activeIr) return [];
      const sign = dir === "asc" ? 1 : -1;
      const arr = activeIr.entities.map((e) => ({ id: e.id, v: ensureFinite(e[channel]) }));
      arr.sort((a, b) => (a.v - b.v) * sign);
      return arr.slice(0, Math.min(n, arr.length)).map((o) => o.id);
    }
    function pinToolkitTrim(addMode) {
      const activeIr = previewIr || ir;
      if (!activeIr) { showToast("Compile IR first.", "warn"); return; }
      const ch = ui.pinTrimChannel.value;
      if (!ch) { showToast("Pick a channel.", "warn"); return; }
      const n = clamp(Math.floor(Number(ui.pinTrimN.value) || 20), 1, MAX_ENTITIES);
      const ids = topNIdsByChannel(activeIr, ch, n, ui.pinTrimDir.value);
      if (!addMode) pinnedEntityIds.clear();
      let added = 0;
      for (const id of ids) {
        if (pinnedEntityIds.size >= MAX_PIN_IDS_PER_GROUP * 4) break;
        if (!pinnedEntityIds.has(id)) { pinnedEntityIds.add(id); added += 1; }
      }
      persistPinned(true);
      updatePinnedInspector();
      refreshPinToolkit();
      updateLimitsReadout();
      renderCurrent();
      ui.pinToolkitStatus.innerHTML = `<span class="ok">${addMode ? "Added" : "Pinned"} ${added} (${ids.length} candidates) by ${escapeHtml(ch)} ${ui.pinTrimDir.value}.</span>`;
    }
    function pinToolkitInvert() {
      const activeIr = previewIr || ir;
      if (!activeIr) { showToast("Compile IR first.", "warn"); return; }
      const cap = MAX_PIN_IDS_PER_GROUP * 4;
      const next = new Set();
      for (const e of activeIr.entities) {
        if (next.size >= cap) break;
        if (!pinnedEntityIds.has(e.id)) next.add(e.id);
      }
      pinnedEntityIds.clear();
      for (const id of next) pinnedEntityIds.add(id);
      persistPinned(true);
      updatePinnedInspector();
      refreshPinToolkit();
      updateLimitsReadout();
      renderCurrent();
      ui.pinToolkitStatus.innerHTML = `<span class="ok">Pinned ${pinnedEntityIds.size} (inverted).</span>`;
    }
    function pinToolkitHalve() {
      if (!pinnedEntityIds.size) { showToast("No pins to halve.", "warn"); return; }
      const arr = Array.from(pinnedEntityIds).sort((a, b) => a - b);
      pinnedEntityIds.clear();
      for (let i = 0; i < arr.length; i += 2) pinnedEntityIds.add(arr[i]);
      persistPinned(true);
      updatePinnedInspector();
      refreshPinToolkit();
      updateLimitsReadout();
      renderCurrent();
      ui.pinToolkitStatus.innerHTML = `<span class="ok">Halved to ${pinnedEntityIds.size}.</span>`;
    }

    function exportFrameSequenceHtml() {
      if (!ir) { showToast("Compile IR first.", "warn"); return; }
      const count = Math.floor(numInput(ui.frameCount, 2, MAX_FRAME_COUNT, 24));
      const step = numInput(ui.frameStep, 0.05, 20, 0.5);
      const frames = [];
      for (let i = 0; i < count; i += 1) {
        const t = i * step;
        frames.push({ t, svg: emitSvg(ir, t, false) });
      }
      const cards = frames.map((f, idx) => `<figure class="card"><figcaption>frame ${idx} · t=${f.t.toFixed(2)}s</figcaption>${f.svg}</figure>`).join("\n");
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>SVG42 frame sequence</title>
<style>
*{box-sizing:border-box}
body{margin:0;color:#e6fffb;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;min-height:100vh;background:radial-gradient(ellipse 70% 38% at 50% 78%,rgba(244,114,182,0.22),transparent 60%),radial-gradient(ellipse 60% 60% at 100% -10%,rgba(94,234,212,0.18),transparent 65%),linear-gradient(180deg,#0a061a 0%,#120732 55%,#1a0a3d 100%)}
body::after{content:"";position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 2px,rgba(255,255,255,0.018) 2px 3px);mix-blend-mode:screen;z-index:1}
h1{position:relative;z-index:2;padding:18px 22px;margin:0;border-bottom:1px solid #4c2890;letter-spacing:0.18em;text-transform:uppercase;font-size:1.1rem;background:linear-gradient(90deg,#5eead4,#22d3ee 50%,#f472b6 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 6px rgba(94,234,212,0.45))}
h1::before{content:"// SVG42 · "}
main{position:relative;z-index:2;display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:14px;padding:16px}
figure{position:relative;margin:0;background:linear-gradient(165deg,rgba(28,16,56,0.82),rgba(40,18,86,0.72));border:1px solid #4c2890;border-radius:10px;overflow:hidden;box-shadow:0 0 0 1px rgba(94,234,212,0.10) inset,0 0 24px rgba(94,234,212,0.06),0 0 1px rgba(244,114,182,0.40);transition:border-color .18s,box-shadow .18s,transform .18s}
figure:hover{border-color:#5eead4;box-shadow:0 0 0 1px rgba(94,234,212,0.30) inset,0 0 22px rgba(94,234,212,0.22),0 0 6px rgba(244,114,182,0.50);transform:translateY(-1px)}
figure::before{content:"";position:absolute;top:0;left:0;width:14px;height:14px;border-top:2px solid #5eead4;border-left:2px solid #5eead4;border-top-left-radius:6px;pointer-events:none;filter:drop-shadow(0 0 4px rgba(94,234,212,0.55))}
figure::after{content:"";position:absolute;bottom:0;right:0;width:14px;height:14px;border-bottom:2px solid #f472b6;border-right:2px solid #f472b6;border-bottom-right-radius:6px;pointer-events:none;filter:drop-shadow(0 0 4px rgba(244,114,182,0.55))}
figcaption{padding:8px 12px;font-size:0.72rem;color:#c4b5fd;letter-spacing:0.10em;text-transform:uppercase;border-bottom:1px solid #4c2890;background:rgba(10,6,26,0.45)}
svg{display:block;width:100%;height:auto;background:#0a061a}
.foot{position:relative;z-index:2;padding:18px 22px;color:#a78bfa;font-size:0.62rem;letter-spacing:0.32em;text-transform:uppercase;text-align:center;border-top:1px solid #4c2890;margin-top:24px}
.foot b{color:#f472b6}
@media (prefers-reduced-motion:reduce){figure{transition:none!important}}
@media print{body{background:#fff!important;color:#000!important}body::after{display:none!important}h1{-webkit-text-fill-color:initial!important;color:#000!important;background:none!important;filter:none!important}figure{background:#fff!important;border-color:#bbb!important;box-shadow:none!important}figcaption{color:#444!important;border-color:#bbb!important;background:#f7f7f9!important}.foot{display:none!important}}
</style></head>
<body><h1>${count} frames @ ${step.toFixed(2)}s step</h1><main>${cards}</main><div class="foot">SVG<b>42</b> · synthwave frame sequence · generated ${new Date().toISOString()}</div></body></html>`;
      download(`svg42_frames_${Date.now()}.html`, html, "text/html;charset=utf-8");
      showToast(`Exported ${count} frames.`, "ok");
    }

    function wireSessionDraftSave() {
      [ui.builderDsl, ui.matrixInput, ui.phase2Input, ui.phase3Input].forEach((el) => {
        if (el) el.addEventListener("input", scheduleSessionDraftSave);
      });
      [ui.entityCount, ui.seed, ui.profile, ui.deltaHeatOnB, ui.autoPreviewScrub, ui.abSwapPanes, ui.deltaChannel, ui.deltaMode].forEach((el) => {
        if (el) el.addEventListener("change", scheduleSessionDraftSave);
      });
    }
    if (ui.draftHint) {
      ui.draftHint.addEventListener("click", (ev) => {
        if (ev.target.id === "btnClearDraft") {
          clearSessionDraft();
          showDraftBarIfAny();
          ui.compileStatus.innerHTML = "<span class=\"ok\">Text draft cleared.</span>";
          return;
        }
        if (ev.target.id === "btnApplyDraft") {
          const d = readSessionDraft();
          if (!d) return;
          applyLocalDraftData(d);
          compileAndReport();
          updatePinGroupUi();
          scheduleSessionDraftSave();
          ui.compileStatus.innerHTML = ir
            ? "<span class=\"ok\">Draft applied to editors and recompiled.</span>"
            : "<span class=\"warn\">Draft applied; compile failed — check matrix/DSL.</span>";
          showDraftBarIfAny();
        }
      });
    }
    if (ui.themeSelect) {
      ui.themeSelect.addEventListener("change", () => applyTheme(ui.themeSelect.value));
    }
    withErr("page-nav-init", () => {
      const tabs = document.querySelectorAll("#pagenav .tab");
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const target = tab.getAttribute("data-page-target");
          setActivePage(target, true);
        });
        // keyboard activation parity (Enter/Space already work for <button>,
        // but Left/Right between tabs gives an arrow-key roving experience)
        tab.addEventListener("keydown", (ev) => {
          if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") {
            const list = Array.from(tabs);
            const idx = list.indexOf(ev.currentTarget);
            const dir = ev.key === "ArrowRight" ? 1 : -1;
            const next = list[(idx + dir + list.length) % list.length];
            if (next) { next.focus(); next.click(); ev.preventDefault(); }
          }
        });
      });
      const stPrev = document.getElementById("pageStrapPrev");
      const stNext = document.getElementById("pageStrapNext");
      if (stPrev) stPrev.addEventListener("click", () => navigatePage(-1));
      if (stNext) stNext.addEventListener("click", () => navigatePage(+1));
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const next = PAGE_HOTKEYS[ev.key];
      if (next) { setActivePage(next, true); ev.preventDefault(); }
    });

    // ---- Command Palette wiring (Ctrl/Cmd+K) ------------------------------
    withErr("palette-init", () => {
      try { buildActionRegistry(); } catch (e) { console.error("[svg42:palette] registry build failed", e); }
      if (!ui.commandPaletteOverlay) return;
      ui.commandPaletteOverlay.addEventListener("click", (ev) => {
        if (ev.target === ui.commandPaletteOverlay) closeCommandPalette();
      });
      if (ui.paletteInput) {
        ui.paletteInput.addEventListener("input", () => {
          _paletteSelected = 0;
          refreshPaletteResults();
        });
        ui.paletteInput.addEventListener("keydown", handlePaletteKey);
      }
      if (ui.paletteResults) {
        ui.paletteResults.addEventListener("click", (ev) => {
          const item = ev.target && ev.target.closest && ev.target.closest(".palette-item");
          if (!item) return;
          const idx = Number(item.getAttribute("data-idx"));
          const r = _paletteFiltered[idx];
          if (r) runAction(r.a);
        });
        ui.paletteResults.addEventListener("mousemove", (ev) => {
          const item = ev.target && ev.target.closest && ev.target.closest(".palette-item");
          if (!item) return;
          const idx = Number(item.getAttribute("data-idx"));
          if (Number.isFinite(idx) && idx !== _paletteSelected) {
            _paletteSelected = idx;
            renderPaletteResults();
          }
        });
      }
      if (ui.btnCommandPalette) ui.btnCommandPalette.addEventListener("click", () => openCommandPalette());
      if (ui.btnExamples) ui.btnExamples.addEventListener("click", () => openCommandPalette("example "));
      if (ui.btnSaveCopy) ui.btnSaveCopy.addEventListener("click", () => exportStandaloneCopy({ bakeState: true }));
    });

    // Capture-phase global hotkey so Ctrl/Cmd+K works from inside textareas too
    document.addEventListener("keydown", (ev) => {
      const k = ev.key;
      if ((ev.metaKey || ev.ctrlKey) && (k === "k" || k === "K")) {
        ev.preventDefault();
        ev.stopPropagation();
        if (_paletteOpen) closeCommandPalette(); else openCommandPalette();
      }
    }, true);
    if (ui.btnHelpDrawer) ui.btnHelpDrawer.addEventListener("click", () => toggleHelpDrawer());
    if (ui.btnCheatsheet) ui.btnCheatsheet.addEventListener("click", () => toggleCheatsheet());
    if (ui.btnShareLink) ui.btnShareLink.addEventListener("click", shareCurrentLink);
    if (ui.btnHudToggle) ui.btnHudToggle.addEventListener("click", () => setStageHud(!stageHudShown));
    if (ui.entityAnnotationInput) {
      ui.entityAnnotationInput.addEventListener("input", () => {
        if (Number.isFinite(selectedEntityId)) setEntityAnnotation(selectedEntityId, ui.entityAnnotationInput.value);
      });
    }
    window.addEventListener("hashchange", () => tryApplyHashFromUrl());

    if (ui.btnTimelinePlay) ui.btnTimelinePlay.addEventListener("click", toggleTimeline);
    if (ui.btnTimelineRewind) ui.btnTimelineRewind.addEventListener("click", rewindTimeline);
    if (ui.timeScrub) {
      ui.timeScrub.addEventListener("input", () => {
        stageTime = Number(ui.timeScrub.value) || 0;
        if (ui.timeReadout) ui.timeReadout.textContent = `t = ${stageTime.toFixed(3)}s`;
        renderCurrent();
      });
    }
    if (ui.timelineFps) ui.timelineFps.addEventListener("change", persistTimelineState);
    if (ui.timelineLoop) ui.timelineLoop.addEventListener("change", () => { setTimelineLoopBounds(); persistTimelineState(); });
    if (ui.overlaysFollowTime) ui.overlaysFollowTime.addEventListener("change", () => { persistTimelineState(); renderCurrent(); });
    if (ui.showConstellation) ui.showConstellation.addEventListener("change", () => { persistTimelineState(); renderCurrent(); });
    if (ui.showPinLabels) ui.showPinLabels.addEventListener("change", () => { persistTimelineState(); renderCurrent(); });

    if (ui.btnStageFitReset) ui.btnStageFitReset.addEventListener("click", resetStageView);
    if (ui.btnDownloadPng) ui.btnDownloadPng.addEventListener("click", rasterizeStageToPng);

    if (ui.histogramBins) ui.histogramBins.addEventListener("change", refreshChannelAtlas);
    if (ui.btnRefreshAtlas) ui.btnRefreshAtlas.addEventListener("click", refreshChannelAtlas);
    if (ui.btnAtlasCopy) ui.btnAtlasCopy.addEventListener("click", () => {
      const txt = atlasStatsTsv();
      if (!txt) { showToast("No IR yet.", "warn"); return; }
      navigator.clipboard.writeText(txt).then(
        () => showToast("Atlas stats copied (TSV).", "ok"),
        () => showToast("Clipboard write failed.", "error")
      );
    });
    if (ui.btnAtlasFilterClear) ui.btnAtlasFilterClear.addEventListener("click", () => {
      if (!atlasFilters.size) return;
      atlasFilters.clear();
      refreshChannelAtlas();
      renderCurrent();
      showToast("Atlas filter cleared.", "ok");
    });
    if (ui.btnAtlasFilterPin) ui.btnAtlasFilterPin.addEventListener("click", () => {
      const activeIr = previewIr || ir;
      if (!activeIr) { showToast("Compile IR first.", "warn"); return; }
      if (!atlasFilters.size) { showToast("No filter set; drag a histogram first.", "warn"); return; }
      const ids = atlasMatchingIds(activeIr);
      if (!ids.length) { showToast("No entities match the filter.", "warn"); return; }
      let added = 0;
      for (const id of ids) {
        if (pinnedEntityIds.size >= MAX_PIN_IDS_PER_GROUP * 4) break;
        if (!pinnedEntityIds.has(id)) { pinnedEntityIds.add(id); added += 1; }
      }
      persistPinned(true);
      updatePinnedInspector();
      updateLimitsReadout();
      renderCurrent();
      showToast(`Pinned ${added} (${ids.length} matches).`, "ok");
    });
    if (ui.atlasFilterDim) ui.atlasFilterDim.addEventListener("change", () => renderCurrent());
    if (ui.atlasOutliers) ui.atlasOutliers.addEventListener("change", () => renderCurrent());
    if (ui.atlasOutlierSigma) ui.atlasOutlierSigma.addEventListener("change", () => renderCurrent());
    if (ui.atlasOutlierChannel) ui.atlasOutlierChannel.addEventListener("change", () => renderCurrent());
    bindAtlasBrush();
    bindScatterInteractions();
    bindTransferInteractions();
    if (ui.btnScatterRefresh) ui.btnScatterRefresh.addEventListener("click", refreshScatter);
    if (ui.btnScatterPinSel) ui.btnScatterPinSel.addEventListener("click", pinScatterSelection);
    if (ui.btnScatterClearSel) ui.btnScatterClearSel.addEventListener("click", clearScatterSelection);
    if (ui.scatterX) ui.scatterX.addEventListener("change", refreshScatter);
    if (ui.scatterY) ui.scatterY.addEventListener("change", refreshScatter);
    if (ui.scatterColor) ui.scatterColor.addEventListener("change", refreshScatter);
    if (ui.scatterSize) ui.scatterSize.addEventListener("change", refreshScatter);
    if (ui.scatterLogX) ui.scatterLogX.addEventListener("change", refreshScatter);
    if (ui.scatterLogY) ui.scatterLogY.addEventListener("change", refreshScatter);
    if (ui.scatterTrend) ui.scatterTrend.addEventListener("change", refreshScatter);
    if (ui.btnPaletteSave) ui.btnPaletteSave.addEventListener("click", savePalette);
    if (ui.btnPaletteDelete) ui.btnPaletteDelete.addEventListener("click", deletePalette);
    if (ui.btnPaletteApply) ui.btnPaletteApply.addEventListener("click", applyPaletteToHue);
    if (ui.btnPaletteRandom) ui.btnPaletteRandom.addEventListener("click", randomizePalette);
    if (ui.btnPaletteRotate) ui.btnPaletteRotate.addEventListener("click", rotatePaletteHue);
    if (ui.paletteStops) ui.paletteStops.addEventListener("input", refreshPaletteSwatches);
    if (ui.paletteBase) ui.paletteBase.addEventListener("input", refreshPaletteSwatches);
    if (ui.paletteSat) ui.paletteSat.addEventListener("input", refreshPaletteSwatches);
    if (ui.paletteLight) ui.paletteLight.addEventListener("input", refreshPaletteSwatches);
    if (ui.paletteSelect) ui.paletteSelect.addEventListener("change", () => {
      const name = ui.paletteSelect.value;
      if (!name || !palettes.has(name)) return;
      activePaletteName = name;
      if (ui.paletteName) ui.paletteName.value = name;
      const stops = palettes.get(name).stops;
      if (stops && stops.length) {
        if (ui.paletteStops) ui.paletteStops.value = String(stops.length);
        if (ui.paletteBase) ui.paletteBase.value = String(Math.round(stops[0].h));
        if (ui.paletteSat) ui.paletteSat.value = String(Math.round(stops[0].s));
        if (ui.paletteLight) ui.paletteLight.value = String(Math.round(stops[0].l));
      }
      refreshPaletteSwatches();
    });
    if (ui.btnDiffMatrixRefresh) ui.btnDiffMatrixRefresh.addEventListener("click", refreshDiffMatrix);
    if (ui.diffMatrixChannel) ui.diffMatrixChannel.addEventListener("change", refreshDiffMatrix);
    if (ui.diffMatrixMetric) ui.diffMatrixMetric.addEventListener("change", refreshDiffMatrix);
    if (ui.btnTransferReset) ui.btnTransferReset.addEventListener("click", resetTransfer);
    if (ui.btnTransferInvert) ui.btnTransferInvert.addEventListener("click", invertTransfer);
    if (ui.btnTransferEase) ui.btnTransferEase.addEventListener("click", easeTransfer);
    if (ui.btnTransferStep) ui.btnTransferStep.addEventListener("click", stepTransfer);
    if (ui.btnTransferApply) ui.btnTransferApply.addEventListener("click", applyTransfer);
    if (ui.btnTransferEmit) ui.btnTransferEmit.addEventListener("click", emitTransferAsPhase3);
    if (ui.btnFrameStripRefresh) ui.btnFrameStripRefresh.addEventListener("click", refreshFrameStrip);
    if (ui.frameStripCount) ui.frameStripCount.addEventListener("change", refreshFrameStrip);
    if (ui.frameStripSpan) ui.frameStripSpan.addEventListener("change", refreshFrameStrip);
    if (ui.btnMacroRecToggle) ui.btnMacroRecToggle.addEventListener("click", toggleMacroRecorder);
    if (ui.btnMacroRecClear) ui.btnMacroRecClear.addEventListener("click", clearMacroRecorder);
    if (ui.btnMacroRecSave) ui.btnMacroRecSave.addEventListener("click", saveMacroRecorder);
    if (ui.btnMacroRecAppendP3) ui.btnMacroRecAppendP3.addEventListener("click", appendMacroRecorderToPhase3);

    // ── Prime Lab wiring ────────────────────────────────────────────────
    // Slider/input `change` (release) fires after the user commits a value,
    // emitting one DSL line per gesture. `input` (continuous) is used only
    // to update the inline numeric labels — never to emit a line, since
    // continuous emission would flood the textarea.
    if (ui.primeLabKappa) {
      ui.primeLabKappa.addEventListener("input", refreshPrimeLabValueLabels);
      ui.primeLabKappa.addEventListener("change", () => emitPrimeLabLine("prime couple " + (+ui.primeLabKappa.value).toFixed(2)));
    }
    if (ui.primeLabEta) {
      ui.primeLabEta.addEventListener("input", refreshPrimeLabValueLabels);
      ui.primeLabEta.addEventListener("change", () => emitPrimeLabLine("prime trap " + (+ui.primeLabEta.value).toFixed(2)));
    }
    if (ui.primeLabEps) {
      ui.primeLabEps.addEventListener("input", refreshPrimeLabValueLabels);
      ui.primeLabEps.addEventListener("change", () => emitPrimeLabLine("prime soft " + (+ui.primeLabEps.value).toFixed(3)));
    }
    if (ui.primeLabMode) ui.primeLabMode.addEventListener("change", () => emitPrimeLabLine("prime mode " + ui.primeLabMode.value));
    if (ui.primeLabOrder) ui.primeLabOrder.addEventListener("change", () => emitPrimeLabLine("prime order " + ui.primeLabOrder.value));
    if (ui.primeLabDt) ui.primeLabDt.addEventListener("change", () => emitPrimeLabLine("prime dt " + (+ui.primeLabDt.value).toFixed(4)));
    if (ui.btnPrimeLabAppendEvolve) ui.btnPrimeLabAppendEvolve.addEventListener("click", () => {
      const n = Math.max(1, Math.floor(+ui.primeLabSteps.value || 1));
      emitPrimeLabLine("prime evolve " + n);
    });
    if (ui.btnPrimeLabAppendParams) ui.btnPrimeLabAppendParams.addEventListener("click", emitPrimeLabAllParams);
    if (ui.btnPrimeLabReset) ui.btnPrimeLabReset.addEventListener("click", () => emitPrimeLabLine("prime reset"));
    refreshPrimeLabValueLabels();

    // ── Phase Portrait wiring ───────────────────────────────────────────
    // The portrait widget is a non-destructive forward simulator. Every
    // button in this section either reads the current IR (Trace) or
    // appends a single DSL line into Phase 3 (.prime-macro-btn). It does
    // not maintain hidden state — the same negative-match smokes that
    // protect the Prime Lab also cover the macro buttons.
    if (ui.btnPrimePortraitTrace) ui.btnPrimePortraitTrace.addEventListener("click", primePortraitTrace);
    if (ui.btnPrimePortraitClear) ui.btnPrimePortraitClear.addEventListener("click", primePortraitClear);
    document.querySelectorAll(".prime-macro-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.getAttribute("data-macro");
        if (name) emitPrimeMacroLine(name);
      });
    });

    if (ui.btnSnapshotSave) ui.btnSnapshotSave.addEventListener("click", saveCurrentSnapshot);
    if (ui.snapshotName) {
      ui.snapshotName.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") { ev.preventDefault(); saveCurrentSnapshot(); }
      });
    }
    if (ui.btnSnapshotExportAll) ui.btnSnapshotExportAll.addEventListener("click", () => {
      if (!snapshots.size) { showToast("No snapshots to export.", "warn"); return; }
      download(`svg42_snapshots_${Date.now()}.json`, snapshotsToJsonPayload(), "application/json");
      showToast(`Exported ${snapshots.size} snapshot(s).`, "ok");
    });
    if (ui.btnSnapshotImportAll) ui.btnSnapshotImportAll.addEventListener("click", () => ui.snapshotImportFile && ui.snapshotImportFile.click());
    if (ui.snapshotImportFile) {
      ui.snapshotImportFile.addEventListener("change", (ev) => {
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const data = safeJsonParse(reader.result);
          if (!data) { showToast("File not valid JSON.", "error"); ui.snapshotImportFile.value = ""; return; }
          importSnapshotsPayload(data, false);
          ui.snapshotImportFile.value = "";
        };
        reader.readAsText(file);
      });
    }
    if (ui.btnSnapshotClear) ui.btnSnapshotClear.addEventListener("click", () => {
      if (!snapshots.size) return;
      if (!confirm(`Delete all ${snapshots.size} snapshot(s)?`)) return;
      snapshots.clear();
      safeLocalRemove(LS_SNAPSHOTS_KEY);
      refreshSnapshotList();
      showToast("Snapshot storage cleared.", "ok");
    });

    document.addEventListener("keydown", (ev) => {
      if (cheatsheetOpen && ev.key === "Escape") { ev.preventDefault(); toggleCheatsheet(false); return; }
      if (focusedIsTextual()) return;
      if (ev.key === "?" || (ev.key === "/" && ev.shiftKey)) {
        ev.preventDefault();
        toggleCheatsheet();
        return;
      }
      if (ev.key === " " || ev.code === "Space") {
        ev.preventDefault();
        toggleTimeline();
        return;
      }
      if (ev.key === "=" || ev.key === "0") {
        ev.preventDefault();
        resetStageView();
        return;
      }
      if (ev.key === "+") {
        ev.preventDefault();
        stageZoom = clamp(stageZoom * 1.1, STAGE_ZOOM_MIN, STAGE_ZOOM_MAX);
        applyStageTransform();
        return;
      }
      if (ev.key === "-") {
        ev.preventDefault();
        stageZoom = clamp(stageZoom * 0.9, STAGE_ZOOM_MIN, STAGE_ZOOM_MAX);
        applyStageTransform();
        return;
      }
      if (ev.key === "s" || ev.key === "S") {
        ev.preventDefault();
        saveCurrentSnapshot();
        return;
      }
    });

    if (ui.btnSearchRun) ui.btnSearchRun.addEventListener("click", () => runPredicateSearch(ui.searchExpr.value));
    if (ui.searchExpr) ui.searchExpr.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); runPredicateSearch(ui.searchExpr.value); } });
    if (ui.btnSearchClear) ui.btnSearchClear.addEventListener("click", () => {
      ui.searchExpr.value = "";
      ui.searchStatus.textContent = "";
      ui.searchResults.textContent = "";
      lastSearchIds = [];
    });
    if (ui.btnSearchPin) ui.btnSearchPin.addEventListener("click", () => {
      const ids = lastSearchIds.length ? lastSearchIds : runPredicateSearch(ui.searchExpr.value);
      if (!ids.length) { showToast("No matches.", "warn"); return; }
      let added = 0;
      for (const id of ids) { if (!pinnedEntityIds.has(id)) { pinnedEntityIds.add(id); added += 1; } }
      persistPinned(true);
      updatePinnedInspector();
      updateLimitsReadout();
      renderCurrent();
      showToast(`Pinned ${added} (${ids.length} matches).`, "ok");
    });
    if (ui.btnSearchUnpin) ui.btnSearchUnpin.addEventListener("click", () => {
      const ids = lastSearchIds.length ? lastSearchIds : runPredicateSearch(ui.searchExpr.value);
      if (!ids.length) { showToast("No matches.", "warn"); return; }
      let removed = 0;
      for (const id of ids) { if (pinnedEntityIds.delete(id)) removed += 1; }
      persistPinned(true);
      updatePinnedInspector();
      updateLimitsReadout();
      renderCurrent();
      showToast(`Unpinned ${removed}.`, "ok");
    });
    if (ui.btnSearchSelect) ui.btnSearchSelect.addEventListener("click", () => {
      const ids = lastSearchIds.length ? lastSearchIds : runPredicateSearch(ui.searchExpr.value);
      if (!ids.length) { showToast("No matches.", "warn"); return; }
      selectedEntityId = ids[0];
      transientJumpId = ids[0];
      if (jumpFlashTimer) clearTimeout(jumpFlashTimer);
      jumpFlashTimer = setTimeout(() => { transientJumpId = null; renderCurrent(); }, 1200);
      updateEntityInspector();
      renderCurrent();
      showToast(`Selected #${ids[0]}.`, "ok");
    });

    if (ui.btnCustomMacroSave) ui.btnCustomMacroSave.addEventListener("click", saveCustomMacro);
    if (ui.btnCustomMacroLoad) ui.btnCustomMacroLoad.addEventListener("click", loadSelectedCustomMacro);
    if (ui.btnCustomMacroDelete) ui.btnCustomMacroDelete.addEventListener("click", deleteSelectedCustomMacro);
    if (ui.btnCustomMacroInsert) ui.btnCustomMacroInsert.addEventListener("click", insertSelectedCustomMacro);

    if (ui.btnPhase3Dry) ui.btnPhase3Dry.addEventListener("click", dryRunPhase3Line);
    if (ui.btnPhase3DryAppend) ui.btnPhase3DryAppend.addEventListener("click", dryRunPhase3Append);
    if (ui.phase3DryLine) ui.phase3DryLine.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); dryRunPhase3Line(); } });
    if (ui.btnPhase2Dry) ui.btnPhase2Dry.addEventListener("click", dryRunPhase2Line);
    if (ui.btnPhase2DryAppend) ui.btnPhase2DryAppend.addEventListener("click", dryRunPhase2Append);
    if (ui.phase2DryLine) ui.phase2DryLine.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); dryRunPhase2Line(); } });
    if (ui.btnRenameChannel) ui.btnRenameChannel.addEventListener("click", renameChannel);
    if (ui.renameChannelTo) ui.renameChannelTo.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); renameChannel(); } });

    if (ui.btnCorrRefresh) ui.btnCorrRefresh.addEventListener("click", refreshCorrelation);
    if (ui.corrChannels) ui.corrChannels.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); refreshCorrelation(); } });

    if (ui.btnFrameExport) ui.btnFrameExport.addEventListener("click", exportFrameSequenceHtml);

    [ui.overlayCentroid, ui.overlayBbox, ui.overlayGrid, ui.overlayHeatmap].forEach((el) => {
      if (el) el.addEventListener("change", () => renderCurrent());
    });

    if (ui.minimapEnabled) ui.minimapEnabled.addEventListener("change", refreshMiniMap);
    bindMiniMapClick();

    if (ui.btnPinTrim) ui.btnPinTrim.addEventListener("click", () => pinToolkitTrim(false));
    if (ui.btnPinAdd) ui.btnPinAdd.addEventListener("click", () => pinToolkitTrim(true));
    if (ui.btnPinInvert) ui.btnPinInvert.addEventListener("click", pinToolkitInvert);
    if (ui.btnPinHalve) ui.btnPinHalve.addEventListener("click", pinToolkitHalve);

    registerAnalytics("atlas", refreshChannelAtlas);
    registerAnalytics("miniMap", refreshMiniMap);
    registerAnalytics("scatter", refreshScatter);
    registerAnalytics("diffMatrix", refreshDiffMatrix);
    registerAnalytics("frameStrip", refreshFrameStrip);
    registerAnalytics("correlation", refreshCorrelation);
    registerAnalytics("transferCanvas", refreshTransferCanvas);
    registerAnalytics("paletteSwatches", refreshPaletteSwatches);
    if (typeof window !== "undefined") {
      window.addEventListener("error", (ev) => {
        if (!ev || !ev.error) return;
        try { console.error("[svg42:uncaught]", ev.error); } catch (_e) { /* noop */ }
        try { showToast("error: " + (ev.error.message || ev.message || "unknown"), "error"); } catch (_e) { /* noop */ }
      });
      window.addEventListener("unhandledrejection", (ev) => {
        const reason = ev && ev.reason;
        try { console.error("[svg42:unhandled-rejection]", reason); } catch (_e) { /* noop */ }
        try { showToast("rejection: " + ((reason && reason.message) || String(reason)), "error"); } catch (_e) { /* noop */ }
      });
    }
    bindStageInteractions();
    wireSessionDraftSave();
    loadPinGroupsFromStorage();
    loadPinnedFromStorage();
    loadSnapshotsFromStorage();
    loadCustomMacros();
    loadStoredTheme();
    loadStoredPage();
    initNetIndicator();
    initProvenancePill();
    loadStageHud();
    loadAnnotations();
    loadPalettes();
    loadTransfer();
    loadMacroRecorder();
    loadTimelineState();
    setTimelineLoopBounds();
    ui.builderDsl.value = DEFAULT_DSL;
    ui.phase2Input.value = PHASE2_DEFAULT;
    ui.phase3Input.value = PHASE3_DEFAULT;
    ui.matrixInput.value = generateRows(120, 42, "swarm");
    schema = parseDsl(ui.builderDsl.value);
    updatePlotChannelOptions();
    // Boot priority: embedded bootstate (from a saved standalone copy) > URL hash > defaults.
    // Each branch is responsible for landing the page in a compiled state.
    const _bootedFromBootstate = tryApplyEmbeddedBootstate();
    if (_bootedFromBootstate) {
      compileAndReport();
    } else if (!tryApplyHashFromUrl()) {
      compileAndReport();
    } else {
      /* compile already ran via tryApplyHashFromUrl */
    }
    updateCheckpointUi();
    updatePinGroupUi();
    refreshSnapshotList();
    refreshCustomMacroUi();
    refreshPinToolkit();
    renderCurrent();
    refreshChannelAtlas();
    refreshPhase3Timing();
    refreshCorrelation();
    refreshMiniMap();
    refreshPaletteSelect();
    refreshPaletteSwatches();
    refreshScatterChannelOptions();
    refreshScatter();
    refreshTransferChannels();
    refreshTransferCanvas();
    refreshDiffMatrixChannelOptions();
    refreshDiffMatrix();
    refreshFrameStrip();
    refreshMacroRecorderUi();
    showDraftBarIfAny();

    // ---------- Fortify self-test --------------------------------------
    // Verify that critical synthwave/page wiring is present and emit one
    // structured console line. Non-fatal: missing parts just lower the score.
    (function fortifySelfTest() {
      try {
        const audit = (typeof auditExternalRefs === "function") ? auditExternalRefs() : { ok: false, offenders: [] };
        const checks = [
          ["pagenav",        () => !!document.getElementById("pagenav")],
          ["pageStrap",      () => !!document.getElementById("pageStrap")],
          ["pageStrapTitle", () => !!document.getElementById("pageStrapTitle")],
          ["pageStrapMeta",  () => !!document.getElementById("pageStrapMeta")],
          ["pageStrapNet",   () => !!document.getElementById("pageStrapNet")],
          ["horizonSun",     () => !!document.querySelector(".horizon-sun")],
          ["bootRibbon",     () => !!document.querySelector(".boot-ribbon")],
          ["activePageAttr", () => !!document.body.getAttribute("data-page")],
          ["themeAttr",      () => !!document.body.getAttribute("data-theme")],
          ["taggedSections", () => document.querySelectorAll(".grid > section[data-page]").length >= 15],
          ["setActivePage",  () => typeof setActivePage === "function"],
          ["navigatePage",   () => typeof navigatePage === "function"],
          ["refreshStrap",   () => typeof refreshPageStrap === "function"],
          ["webManifest",    () => !!document.querySelector('link[rel="manifest"]')],
          ["faviconInline",  () => {
            const ico = document.querySelector('link[rel~="icon"]');
            return !!ico && /^data:/i.test(ico.getAttribute("href") || "");
          }],
          ["themeColorMeta", () => !!document.querySelector('meta[name="theme-color"]')],
          ["zeroExternalRefs", () => audit && audit.ok === true],
          ["netIndicatorBound", () => typeof refreshNetIndicator === "function"],
          ["commandPalette",    () => !!document.getElementById("commandPalette") && typeof openCommandPalette === "function"],
          ["actionRegistry",    () => Array.isArray(ACTION_REGISTRY) && ACTION_REGISTRY.length >= 20],
          ["examplesGallery",   () => Array.isArray(EXAMPLE_SCENES) && EXAMPLE_SCENES.length >= 6],
          ["fuzzyScoreFn",      () => typeof fuzzyScore === "function"],
          ["exportFn",          () => typeof exportStandaloneCopy === "function"],
          ["bootstateFn",       () => typeof tryApplyEmbeddedBootstate === "function"],
          ["runtimeInfoFn",     () => typeof getRuntimeInfo === "function" && typeof buildRuntimeReport === "function"],
          ["serveCmds",         () => Array.isArray(LOCAL_SERVE_CMDS) && LOCAL_SERVE_CMDS.length >= 5],
          ["exportActions",     () => ACTION_REGISTRY.some((a) => a.id === "export.with-state") && ACTION_REGISTRY.some((a) => a.id === "app.install-pwa")],
        ];
        const results = checks.map(([name, fn]) => {
          let ok = false;
          try { ok = !!fn(); } catch (_e) { ok = false; }
          return { name, ok };
        });
        const passed = results.filter((r) => r.ok).length;
        const total = results.length;
        const failed = results.filter((r) => !r.ok).map((r) => r.name);
        if (passed === total) {
          try { console.info("[svg42:fortify] OK " + passed + "/" + total + " · offline-ready"); } catch (_e) { /* noop */ }
          document.body.setAttribute("data-fortified", "true");
          document.body.setAttribute("data-offline-ready", "true");
        } else {
          try { console.warn("[svg42:fortify] " + passed + "/" + total + " — missing: " + failed.join(", ")); } catch (_e) { /* noop */ }
          document.body.setAttribute("data-fortified", "partial");
          document.body.setAttribute("data-offline-ready", audit && audit.ok ? "true" : "false");
        }
        if (audit && !audit.ok && Array.isArray(audit.offenders) && audit.offenders.length) {
          try {
            console.warn("[svg42:offline] external references detected:",
              audit.offenders.slice(0, 8).map((o) => o.tag + "[" + o.attr + "]=" + o.url));
          } catch (_e) { /* noop */ }
        }
      } catch (e) {
        try { console.error("[svg42:fortify-selftest]", e); } catch (_e) { /* noop */ }
      }
    })();
  
;
