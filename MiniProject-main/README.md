
# SnapIt (A cashier-free transaction and checkout system)
The PayApp project is an innovative solution that integrates RFID technology, QR code scanning, and a comprehensive web application to streamline the process of product management, purchase, and theft prevention. This project was developed as part of a hackathon and leverages the power of the ESP32 microcontroller, MongoDB Atlas, and modern web technologies to deliver a seamless user experience.



## Features

- ESP32 Integration: Utilizes an RFID reader to identify products and prevent theft.
- QR Code Scanning: Allows users to scan products using QR codes for quick information retrieval.
- Web Application: User-friendly interface for scanning products, viewing product details, making purchases, returning products, and managing user balance.
- Backend Server: Manages API requests, processes transactions, and handles product data stored in MongoDB.
- Real-time Updates: Ensures that the product information and user balance are always up-to-date.

## Store-side Dashboard App
https://snap-it-dashboard.onrender.com


## Tech Stack

**Client:** HTML, CSS,

**Server:** Node, Express, MongoDB Atlas

**Hardware:** ESP32, MFRC522 RFID Sensor


## Deployment
To use the app visit this url:
https://snap-it-n16t.onrender.com (view preferably on a mobile phone)

Login with dummy username: user@gmail.com and passwd: 123

Note: The app's backend is hosted on the free-tier offered by render. The app's functionality won't be usable instantly. It takes around a minute for the server hosting the API to fire up once the site is opened. After that, it should work smoothly.

To test the product scanning feature, scan any of the two QR codes below and try to perform a purchase or a return

![Javatpoint](https://i.ibb.co/7V2DF0w/Amul.png)

Product 1: Amul Icecream (UID: 44c2d1cf)


![Javatpoint](https://i.ibb.co/7V2DF0w/Amul.png) 

Product 2: Camlin Oil Pastels (UID:71a6d2cf ) 


Note: The hardware part of the project requires an Express server to run in the background and won't be of any utility in the absence of the necessary electronic components.Sure, here are the updated commands with the provided backend link:

## API Endpoints

### 1. Check UID

**Endpoint**: `/checkUID`

**Method**: `GET`

**Description**: Verifies product ownership by checking the UID.

**Request Parameters**:

| Parameter | Type   | Description       |
|-----------|--------|-------------------|
| `uid`     | String | The UID of the product |

**Response**:

- **Success**: Returns product details if the UID is found.
- **Failure**: Returns an error message if the product is not found.

**Example Request**:

```bash
curl -X GET "https://hackathon-submission-q1mg.onrender.com/checkUID?uid=your_uid"
```

**Example Response**:

```json
{
  "product": {
    "_id": "66a545526c8946f8b8ddb038",
    "ProductName": "Example Product",
    "ProductOwner": "supermarket",
    "ProductPrice": 12.99,
    "ImageLink": "http://example.com/image.jpg",
    "UID": "71a6d2cf"
  }
}
```

### 2. Purchase Product

**Endpoint**: `/purchaseProduct`

**Method**: `POST`

**Description**: Processes the purchase of a product by updating the ProductOwner to the user.

**Request Body**:

| Parameter     | Type   | Description                       |
|---------------|--------|-----------------------------------|
| `uid`         | String | The UID of the product            |
| `username`    | String | The username of the purchaser     |
| `balance`     | Number | The current balance of the user   |

**Response**:

- **Success**: Updates the product's ProductOwner and returns a success message.
- **Failure**: Returns an error message if the purchase fails (e.g., insufficient balance).

**Example Request**:

```bash
curl -X POST "https://hackathon-submission-q1mg.onrender.com/purchaseProduct" -H "Content-Type: application/json" -d '{"uid": "71a6d2cf", "username": "swayam_raut", "balance": 100}'
```

**Example Response**:

```json
{
  "message": "Product purchased successfully.",
  "newBalance": 87.01
}
```

### 3. Return Product

**Endpoint**: `/returnProduct`

**Method**: `POST`

**Description**: Handles the return of a product by updating the ProductOwner back to "supermarket".

**Request Body**:

| Parameter  | Type   | Description                  |
|------------|--------|------------------------------|
| `uid`      | String | The UID of the product       |
| `username` | String | The username of the returner |

**Response**:

- **Success**: Updates the product's ProductOwner and returns a success message.
- **Failure**: Returns an error message if the return fails.

**Example Request**:

```bash
curl -X POST "https://hackathon-submission-q1mg.onrender.com/returnProduct" -H "Content-Type: application/json" -d '{"uid": "71a6d2cf", "username": "swayam_raut"}'
```

**Example Response**:

```json
{
  "message": "Product returned successfully."
}
```

### 4. Fetch Purchases

**Endpoint**: `/purchases`

**Method**: `GET`

**Description**: Retrieves the purchase history for the user.

**Request Parameters**:

| Parameter  | Type   | Description               |
|------------|--------|---------------------------|
| `username` | String | The username of the user  |

**Response**:

- **Success**: Returns a list of products purchased by the user.
- **Failure**: Returns an error message if the request fails.

**Example Request**:

```bash
curl -X GET "https://hackathon-submission-q1mg.onrender.com/purchases?username=swayam_raut"
```

**Example Response**:

```json
[
  {
    "_id": "66a545526c8946f8b8ddb038",
    "ProductName": "Example Product",
    "ProductOwner": "swayam_raut",
    "ProductPrice": 12.99,
    "ImageLink": "http://example.com/image.jpg",
    "UID": "71a6d2cf"
  }
]
```

