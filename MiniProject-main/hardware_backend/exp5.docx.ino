#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>

#define SS_PIN 5      // GPIO 5 on ESP32
#define RST_PIN 22    // GPIO 22 on ESP32
#define BUZZER_PIN 2  // GPIO 2 on ESP32
#define LED_PIN 15    // GPIO 15 for LED

MFRC522 rfid(SS_PIN, RST_PIN);

const char* ssid = "Aditya2.4G";               // Replace with your Wi-Fi SSID
const char* password = "Adar1234";    // Replace with your Wi-Fi password
const char* apiEndpoint = "http://192.168.29.40:3000"; // Replace with your API URL

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  connectToWiFi();
  Serial.println("Place your RFID tag near the reader...");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) {
    delay(50);
    return;
  }

  if (!rfid.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  Serial.print("UID tag: ");
  String content = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    Serial.print(rfid.uid.uidByte[i] < 0x10 ? " 0" : " ");
    Serial.print(rfid.uid.uidByte[i], HEX);
    content.concat(String(rfid.uid.uidByte[i] < 0x10 ? "0" : ""));
    content.concat(String(rfid.uid.uidByte[i], HEX));
  }
  Serial.println();

  // Send UID to the server and check the response
  checkUIDInDatabase(content);

  rfid.PICC_HaltA();
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("Connected to WiFi");
}

void checkUIDInDatabase(String uid) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(apiEndpoint) + "/checkUID?uid=" + uid;
    
    WiFiClient client;
    http.begin(client, url);

    Serial.println("Requesting URL: " + url); // Print requested URL

    int httpCode = http.GET();
    String payload = http.getString();

    Serial.println("HTTP Code: " + String(httpCode)); // Print HTTP response code
    Serial.println("Response from server: " + payload); // Print response from server

    if (httpCode > 0 && payload.indexOf("supermarket") != -1) {
      // If the owner is "supermarket," turn on the buzzer
      digitalWrite(BUZZER_PIN, HIGH); // Turn on buzzer
      delay(1000); // Keep buzzer on for 1 second
      digitalWrite(BUZZER_PIN, LOW);  // Turn off buzzer
      delay(1000);
    } else if (httpCode > 0 && payload.indexOf("supermarket") == -1) {
      // If the owner is not "supermarket," light up the LED
      digitalWrite(LED_PIN, HIGH); // Turn on LED
      delay(1000); // Keep LED on for 1 second
      digitalWrite(LED_PIN, LOW);  // Turn off LED
      delay(1000);
    } else {
      Serial.println("Error in HTTP request: " + String(httpCode));
    }
    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}
