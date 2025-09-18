
/**
 * pure::variants JavaScript Transformation Module
 * Refatorado para montar um esqueleto Flutter em output/exec_yyyyMMdd_HHmmss/
 * copiando um conjunto base do input/ e adicionando pastas de features selecionadas.
 */

var pv_module = module_instance();

/**
 * work: função principal chamada pelo pure::variants
 * Cria pasta exec_..., registra log e copia arquivos/pastas conforme features selecionadas.
 * @return {ClientTransformStatus}
 */
function work() {
	var status = new ClientTransformStatus();
	status.setMessage(Constants().EMPTY_STRING);
	status.setStatus(ClientTransformStatus().OK);

	// Cria exec folder
	var execFolderName = "exec_" + (new java.text.SimpleDateFormat("yyyyMMdd_HHmmss")).format(new java.util.Date());
	var execFolder = new java.io.File(pv_module.getOutput(), execFolderName);
	try {
		if (!execFolder.exists()) {
			if (!execFolder.mkdirs()) {
				status.setMessage("Falha ao criar pasta de execução: " + execFolder.getAbsolutePath());
				status.setStatus(ClientTransformStatus().ERROR);
				return status;
			}
		}
	} catch (e) {
		status.setMessage("Erro ao criar pasta de execução: " + e.toString());
		status.setStatus(ClientTransformStatus().ERROR);
		return status;
	}

	var logFile = null;
	function openLog() {
		if (logFile == null) {
			logFile = new java.io.FileWriter(new java.io.File(execFolder, "debug.log"), true);
		}
	}
	function log(msg) {
		openLog();
		var ts = (new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss")).format(new java.util.Date());
		logFile.write(ts + " - " + msg + "\n");
		logFile.flush();
	}

	// Helpers para copiar recursivamente usando java.io streams
	function ensureDir(dir) {
		if (!dir.exists()) {
			dir.mkdirs();
		}
	}

	function copyFile(srcFile, dstFile) {
		var fis = null;
		var fos = null;
		try {
			fis = new java.io.FileInputStream(srcFile);
			fos = new java.io.FileOutputStream(dstFile);
			var buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 8192);
			var read = 0;
			while ((read = fis.read(buffer)) != -1) {
				fos.write(buffer, 0, read);
			}
			return true;
		} finally {
			try { if (fis) fis.close(); } catch (e) {}
			try { if (fos) fos.close(); } catch (e) {}
		}
	}

	function copyDir(srcDir, dstDir, stats, featureName) {
		ensureDir(dstDir);
		var files = srcDir.listFiles();
		if (files == null) return;
		for (var i = 0; i < files.length; i++) {
			var f = files[i];
			var rel = f.getName();
			var dest = new java.io.File(dstDir, rel);
			if (f.isDirectory()) {
				copyDir(f, dest, stats, featureName);
			} else {
				var overwrittenBy = null;
				if (dest.exists()) {
					// register conflict: last feature wins
					overwrittenBy = stats.pathOwner[dest.getAbsolutePath()];
					log("Conflito: arquivo '" + dest.getAbsolutePath() + "' será sobrescrito pela feature '" + featureName + "' (antes: '" + overwrittenBy + "')");
					stats.warnings++;
				}
				try {
					copyFile(f, dest);
					stats.filesCopied++;
					stats.pathOwner[dest.getAbsolutePath()] = featureName;
					stats.copiedPaths.push({src: f.getAbsolutePath(), dst: dest.getAbsolutePath(), feature: featureName, overwrittenBy: overwrittenBy});
				} catch (e) {
					log("Erro ao copiar arquivo '" + f.getAbsolutePath() + "' -> '" + dest.getAbsolutePath() + "': " + e.toString());
					stats.errors++;
				}
			}
		}
	}

	function normalizeFeatureName(name) {
		if (name == null) return null;
		return name.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_\-]/g, "_");
	}

	// Estatísticas
	var stats = {
		features: [],
		filesCopied: 0,
		warnings: 0,
		errors: 0,
		pathOwner: {},
		copiedPaths: []
	};

	log("Exec path: " + execFolder.getAbsolutePath());

	// Copy base minimal skeleton from input
	try {
		var inputRoot = new java.io.File(pv_module.getInput());
		if (!inputRoot.exists()) {
			log("Input root não existe: " + pv_module.getInput());
			status.setMessage("Input root não existe: " + pv_module.getInput());
			status.setStatus(ClientTransformStatus().ERROR);
			return status;
		}

		// Minimal items to copy (MVP)
		var baseItems = [
			"pubspec.yaml",
			"lib/app",
			"lib/core",
			"assets",
			"android",
			"ios",
			"web",
			"lib/main.dart"
		];

		for (var bi = 0; bi < baseItems.length; bi++) {
			var rel = baseItems[bi];
			var src = new java.io.File(inputRoot, rel);
			var dst = new java.io.File(execFolder, rel);
			if (!src.exists()) {
				log("Aviso: item base não encontrado no input: " + src.getAbsolutePath());
				stats.warnings++;
				continue;
			}
			if (src.isDirectory()) {
				copyDir(src, dst, stats, "<base>");
				log("Copiando pasta base: " + src.getAbsolutePath() + " -> " + dst.getAbsolutePath());
			} else {
				try {
					ensureDir(dst.getParentFile());
					copyFile(src, dst);
					stats.filesCopied++;
					stats.copiedPaths.push({src: src.getAbsolutePath(), dst: dst.getAbsolutePath(), feature: "<base>", overwrittenBy: null});
				} catch (e) {
					log("Erro ao copiar arquivo base: " + src.getAbsolutePath() + " -> " + e.toString());
					stats.errors++;
				}
			}
		}
	} catch (e) {
		log("Erro durante cópia base: " + e.toString());
		status.setMessage(e.toString());
		status.setStatus(ClientTransformStatus().ERROR);
		return status;
	}

	// Traverse models and collect selected features
	try {
		var models = pv_module.getModels();
		for (var m = 0; m < models.length; m++) {
			var model = new IPVModel(models[m]);
			if (model.getType().equals(ModelConstants().CFM_TYPE) || model.getType().equals(ModelConstants().FM_TYPE)) {
				var rootid = model.getElementsRootID();
				var rootElement = model.getElementWithID(rootid);
				// recursive traversal
				function collect(element) {
					log("Feature selecionada: " + element.getVName());
					stats.features.push({name: element.getVName(), element: element});
					var iter = element.getChildren().iterator();
					while (iter.hasNext()) {
						collect(iter.next());
					}
				}
				collect(rootElement);
			}
		}
	} catch (e) {
		log("Erro ao coletar features: " + e.toString());
		status.setMessage(e.toString());
		status.setStatus(ClientTransformStatus().ERROR);
		return status;
	}

	// For each collected feature, copy feature folder
	for (var fi = 0; fi < stats.features.length; fi++) {
		var feat = stats.features[fi];
		var elem = feat.element;
		var fname = feat.name;
		var norm = normalizeFeatureName(fname);
		// determine feature directory: attribute 'dir' overrides
		var dirAttr = null;
		try {
			if (elem.hasPropertyWithName && elem.hasPropertyWithName('dir')) {
				var prop = elem.getPropertyWithName('dir');
				if (prop != null) {
					var constv = prop.getFirstConstant();
					if (constv != null) dirAttr = constv.getValue();
				}
			}
		} catch (e) {
			// ignore attribute parsing errors
		}

		var relPath = null;
		if (dirAttr && dirAttr.length() > 0) {
			relPath = dirAttr;
		} else {
			relPath = 'lib/features/' + norm;
		}

		var srcFeat = new java.io.File(pv_module.getInput(), relPath);
		var dstFeat = new java.io.File(execFolder, relPath);

		if (!srcFeat.exists()) {
			log("Aviso: pasta da feature não encontrada: " + srcFeat.getAbsolutePath() + " (feature: " + fname + ")");
			stats.warnings++;
			continue;
		}

		log("Copiando feature: " + fname + " de " + srcFeat.getAbsolutePath() + " -> " + dstFeat.getAbsolutePath());
		var beforeFiles = stats.filesCopied;
		try {
			copyDir(srcFeat, dstFeat, stats, fname);
		} catch (e) {
			log("Erro ao copiar feature '" + fname + "': " + e.toString());
			stats.errors++;
		}
		var copiedForFeature = stats.filesCopied - beforeFiles;
		log("Arquivos copiados para feature '" + fname + "': " + copiedForFeature);
	}

	// Final summary
	log("---- Resumo ----");
	log("Total features processadas: " + stats.features.length);
	log("Total arquivos copiados: " + stats.filesCopied);
	log("Warnings: " + stats.warnings + ", Errors: " + stats.errors);

	if (logFile != null) {
		try { logFile.close(); } catch (e) {}
	}

	if (stats.errors > 0) {
		status.setMessage("Erros durante a cópia. Ver debug.log em " + execFolder.getAbsolutePath());
		status.setStatus(ClientTransformStatus().ERROR);
	} else {
		status.setMessage("Saída criada em: " + execFolder.getAbsolutePath());
		status.setStatus(ClientTransformStatus().OK);
	}

	return status;
}

// notas: mantivemos assinatura e comportamento de logging/retorno compatível com pure::variants
