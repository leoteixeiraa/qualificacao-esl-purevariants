/**
 * To set up JavaScript Transformation open configuration space properties
 * and go to "Configuration Space" -> "Transformation Configuration"
 * and add a JavaScript Transformation Module with this JavaScript.
 */


/**
 * Transformation module instance
 */
var pv_module = module_instance();



// Variáveis globais para pasta e log


/**
 * Do the work of this JavaScript transformation module
 * @return {ClientTransformStatus} the status of this module method
 */
function work() {
	var status = new ClientTransformStatus();
	status.setMessage(Constants().EMPTY_STRING);
	status.setStatus(ClientTransformStatus().OK);

	// Gera nome único para a execução (timestamp)
	var execFolderName = "exec_" + (new java.text.SimpleDateFormat("yyyyMMdd_HHmmss")).format(new java.util.Date());
	var execFolder = new java.io.File(pv_module.getOutput(), execFolderName);
	if (!execFolder.exists()) {
		execFolder.mkdirs();
	}

	// Arquivo de log para registrar as features selecionadas
	var logFile = new java.io.FileWriter(new java.io.File(execFolder, "debug.log"), true);
	function log(msg) {
		logFile.write(msg + "\n");
		logFile.flush();
	}

	function logSelectedFeatures(element) {
		log("Feature selecionada: " + element.getVName());
		var iter = element.getChildren().iterator();
		while (iter.hasNext()) {
			logSelectedFeatures(iter.next());
		}
	}

	function createFeatureClass(element) {
		var name = element.getVName();
		var filename = name + ".java";
		var outputFile = new java.io.File(execFolder, filename);

		// Caminho para o template
		var templateFile = new java.io.File(pv_module.getInput(), "templates/" + filename);

		var writer = new java.io.FileWriter(outputFile);

		var parent = element.getParent();
		if (parent != null) {
			writer.write("// Parent feature: " + parent.getVName() + "\n");
		}

		if (templateFile.exists()) {
			log("Usando template customizado para: " + name);
			var scanner = new java.util.Scanner(templateFile);
			while (scanner.hasNextLine()) {
				var line = scanner.nextLine();
				if (!line.trim().startsWith("package ")) {
					writer.write(line + "\n");
				}
			}
			scanner.close();
		} else {
			log("Gerando classe padrão para: " + name);
			// if a release state is specified in attribute "state" it will be written to class file
			if (element.hasPropertyWithName("state")) {
				writer.write("//Release state of this feature: ");
				var value = "unknown";
				var constant = element.getPropertyWithName("state").getFirstConstant();
				if (constant != null) {
					value = constant.getValue();
				}
				writer.write(value + "\n\n");
			}
			writer.write("public class " + name + " {\n\n}\n");
		}

		writer.close();

		// Processa filhos
		var iter = element.getChildren().iterator();
		while (iter.hasNext()) {
			createFeatureClass(iter.next());
		}
	}

	try {
		var models = pv_module.getModels();
		for (var index = 0; index < models.length; index++) {
			var model = new IPVModel(models[index]);
			// we only want to process Feature Models
			if (model.getType().equals(ModelConstants().CFM_TYPE)
				|| model.getType().equals(ModelConstants().FM_TYPE)) {
				var rootid = model.getElementsRootID();
				var rootElement = model.getElementWithID(rootid);
				logSelectedFeatures(rootElement);
				createFeatureClass(rootElement);
			}
		}
	} catch (e) {
		// If something went wrong, catch error and return error status with
		// specific error message.
		status.setMessage(e.toString());
		status.setStatus(ClientTransformStatus().ERROR);
	}
/**
 * Log features selected recursively
 * @param {IPVElement} element
 */
function logSelectedFeatures(element) {
	log("Feature selecionada: " + element.getVName());
	var iter = element.getChildren().iterator();
	while (iter.hasNext()) {
		logSelectedFeatures(iter.next());
	}
}
	// if no error occurred return OK status
	return status;
}

/**
 * Create a class for each feature
 * @param {IPVElement} element The feature
 */

function createFeatureClass(element) {
	var name = element.getVName();
	var filename = name + ".java";
	var outputFile = new java.io.File(execFolder, filename);

	// Caminho para o template
	var templateFile = new java.io.File(pv_module.getInput(), "templates/" + filename);

	var writer = new java.io.FileWriter(outputFile);

	var parent = element.getParent();
	if (parent != null) {
		writer.write("// Parent feature: " + parent.getVName() + "\n");
	}

	if (templateFile.exists()) {
		log("Usando template customizado para: " + name);
		var scanner = new java.util.Scanner(templateFile);
		while (scanner.hasNextLine()) {
			var line = scanner.nextLine();
			if (!line.trim().startsWith("package ")) {
				writer.write(line + "\n");
			}
		}
		scanner.close();
	} else {
		log("Gerando classe padrão para: " + name);
		// if a release state is specified in attribute "state" it will be written to class file
		if (element.hasPropertyWithName("state")) {
			writer.write("//Release state of this feature: ");
			var value = "unknown";
			var constant = element.getPropertyWithName("state").getFirstConstant();
			if (constant != null) {
				value = constant.getValue();
			}
			writer.write(value + "\n\n");
		}
		writer.write("public class " + name + " {\n\n}\n");
	}

	writer.close();

	// Processa filhos
	var iter = element.getChildren().iterator();
	while (iter.hasNext()) {
		createFeatureClass(iter.next());
	}
}
