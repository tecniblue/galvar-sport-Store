export const getBaseStyles = () => `
  <style>
    body {
      font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
      color: #18181b;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #000000;
      padding: 30px 20px;
      text-align: center;
    }
    .content {
      padding: 40px 30px;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 10px;
      color: #000000;
    }
    .subtitle {
      font-size: 16px;
      color: #52525b;
      margin-bottom: 30px;
    }
    .details-box {
      background-color: #f4f4f5;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .detail-label {
      color: #52525b;
      font-weight: 500;
    }
    .detail-value {
      font-weight: 600;
      color: #18181b;
      text-align: right;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      text-align: left;
      padding-bottom: 15px;
      border-bottom: 2px solid #e4e4e7;
      color: #52525b;
      font-weight: 600;
      font-size: 14px;
    }
    td {
      padding: 15px 0;
      border-bottom: 1px solid #e4e4e7;
    }
    .item-name {
      font-weight: 600;
      color: #18181b;
    }
    .item-meta {
      font-size: 12px;
      color: #71717a;
      margin-top: 4px;
    }
    .total-row td {
      font-size: 18px;
      font-weight: 700;
      border-bottom: none;
      padding-top: 20px;
    }
    .footer {
      background-color: #fafafa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e4e4e7;
    }
    .footer-title {
      font-weight: 600;
      margin-bottom: 10px;
    }
    .footer-text {
      font-size: 14px;
      color: #71717a;
      margin: 5px 0;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background-color: #10b981;
      color: white;
    }

    /* Mobile Responsive Styles */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
      }
      .content {
        padding: 20px 15px !important;
      }
      .header {
        padding: 20px 15px !important;
      }
      .detail-row {
        display: block !important;
        margin-bottom: 12px !important;
      }
      .detail-label {
        display: block !important;
        margin-bottom: 4px !important;
      }
      .detail-value {
        display: block !important;
        text-align: left !important;
      }
      .title {
        font-size: 20px !important;
      }
      .subtitle {
        font-size: 14px !important;
        margin-bottom: 20px !important;
      }
      .details-box {
        padding: 15px !important;
      }
      table td, table th {
        padding: 10px 0 !important;
      }
    }
  </style>
`;
