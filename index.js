import axios from "axios";
import { stringify } from "qs";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = "TimeoutError";
  }
}

const requestPayment = async (muid, phone_number, amount) => {
  try {
    const data = stringify({
      muid: muid,
      phone_number: phone_number,
      amount: amount,
    });

    const config = {
      method: "post",
      url: "https://api.moneyunify.com/v2/request_payment",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: data,
    };

    const response = await axios(config);
    if (response.status !== 200) {
      throw new ApiError("Failed to request payment", response.status);
    }
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new ApiError(error.response.data.message, error.response.status);
    } else if (error.request) {
      throw new Error("No response received from the server");
    } else {
      throw new Error(error.message);
    }
  }
};

const verifyTransaction = async (muid, reference) => {
  try {
    const data = stringify({
      muid: muid,
      reference: reference,
    });

    const config = {
      method: "post",
      url: "https://api.moneyunify.com/v2/verify_transaction",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: data,
    };

    const response = await axios(config);
    if (response.status !== 200) {
      throw new ApiError("Failed to verify transaction", response.status);
    }
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new ApiError(error.response.data.message, error.response.status);
    } else if (error.request) {
      throw new Error("No response received from the server");
    } else {
      throw new Error(error.message);
    }
  }
};

const sendMoney = async (
  muid,
  email,
  first_name,
  last_name,
  phone_number,
  transaction_details,
) => {
  try {
    const data = stringify({
      muid: muid,
      email: email,
      first_name: first_name,
      last_name: last_name,
      phone_number: phone_number,
      transaction_details: transaction_details,
    });

    const config = {
      method: "post",
      url: "https://api.moneyunify.com/v2/send_money",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: data,
    };

    const response = await axios(config);
    if (response.status !== 200) {
      throw new ApiError("Failed to send money", response.status);
    }
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new ApiError(error.response.data.message, error.response.status);
    } else if (error.request) {
      throw new Error("No response received from the server");
    } else {
      throw new Error(error.message);
    }
  }
};

const pollTransactionStatus = async (
  muid,
  reference,
  interval = 5000,
  maxAttempts = 12,
) => {
  let attempts = 0;

  const poll = async (resolve, reject) => {
    try {
      const response = await verifyTransaction(muid, reference);

      if (response.data.status === "successful") {
        resolve(response);
      } else if (
        response.data.status === "failed" ||
        response.data.status === "declined"
      ) {
        reject(
          new ApiError("Transaction failed or was declined", response.status),
        );
      } else if (attempts >= maxAttempts) {
        reject(new TimeoutError("Transaction verification timed out"));
      } else {
        attempts += 1;
        setTimeout(poll, interval, resolve, reject);
      }
    } catch (error) {
      reject(error);
    }
  };

  return new Promise(poll);
};

module.exports = {
  requestPayment,
  verifyTransaction,
  sendMoney,
  pollTransactionStatus,
  ApiError,
  TimeoutError,
};
