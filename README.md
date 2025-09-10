# Craftify_Web_Catalyst

## \#\# API Endpoints

The backend server provides the following RESTful API endpoints:

#### Auth

  - `POST /api/auth/register`: Creates a new user account.
  - `POST /api/auth/login`: Logs in a user and returns a JWT.
  - `GET /api/auth/me`: Retrieves the currently authenticated user's profile.

#### Products

  - `GET /api/products`: Retrieves a paginated list of all products with filtering and sorting.
  - `GET /api/products/featured`: Retrieves a list of featured products.
  - `GET /api/products/:id`: Retrieves a single product by its ID.
  - `POST /api/products`: Creates a new product (seller/admin only).
  - `PUT /api/products/:id`: Updates an existing product (seller/admin only).
  - `DELETE /api/products/:id`: Deletes a product (seller/admin only).

#### Reviews

  - `POST /api/products/:id/reviews`: Adds a review to a product.
  - `PUT /api/products/:productId/reviews/:reviewIndex/reply`: Adds a seller's reply to a review.

#### Orders

  - `POST /api/orders`: Creates a new order for the authenticated user.
  - `GET /api/orders`: Retrieves the authenticated buyer's order history.
  - `GET /api/orders/seller`: Retrieves all orders containing a seller's products (seller/admin only).
  - `PUT /api/orders/:id/status`: Updates the status of an order (seller/admin only).

-----

## \#\# How to Use

Once the application is running, you can:

1.  **Register as a Buyer**: Create an account with the "buyer" role to browse products, leave reviews, and place orders.
2.  **Register as a Seller**: Create an account with the "seller" role to start listing your own handcrafted items for sale.
3.  **Manage Your Products**: If you're a seller, navigate to your dashboard to add new items or manage existing ones.
4.  **Explore and Purchase**: As a buyer, use the search and filter options to find unique crafts and proceed through the simulated checkout process to place an order.

-----

## \#\# Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

-----

## \#\# Contact

Srivatsava - [@your\_twitter\_handle](https://www.google.com/search?q=https://twitter.com/your_twitter_handle) - your-email@example.com

Project Link: [https://github.com/srivatsava05/bunny](https://github.com/srivatsava05/bunny)

