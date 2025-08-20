
/**
 * Script de transformação JavaScript para pure::variants
 *
 * Este script gera arquivos Java (.java) para cada feature do modelo de configuração.
 * - Se existir um template customizado para a feature em input/templates, ele é usado.
 * - Caso contrário, gera um arquivo padrão.
 * - Todos os arquivos e o log da execução são salvos em uma subpasta única dentro de output.
 * - O log registra todas as features processadas e o tipo de geração utilizada.
 *
 * Para usar: configure este script como módulo de transformação JavaScript no pure::variants.
 */



/**
 * Instância do módulo de transformação do pure::variants
 */
var pv_module = module_instance();



// Variáveis globais para pasta e log


/**
 * Função principal executada pelo pure::variants ao rodar a transformação.
 * Cria uma pasta única para a execução, gera os arquivos Java e registra o log.
 * @return {ClientTransformStatus} Status da execução da transformação
 */
function work() {
	/**
	 * Escreve uma mensagem no arquivo de log da execução.
	 * @param {string} msg Mensagem a ser registrada
	 */
	/**
	 * Registra no log todas as features selecionadas, de forma recursiva.
	 * @param {IPVElement} element Elemento raiz da feature
	 */
	/**
	 * Gera o arquivo Java para uma feature.
	 * Se existir um template customizado, utiliza o template.
	 * Caso contrário, gera um arquivo padrão.
	 * Inclui comentário com o nome da feature pai, se existir.
	 * @param {IPVElement} element Elemento da feature
	 */
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
