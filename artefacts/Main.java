public class Main {
    public static void main(String[] args) {
        Comunicacao comunicacao = new WiFi(); // ou ZigBee
        comunicacao.transmitirDados();
    }
}
