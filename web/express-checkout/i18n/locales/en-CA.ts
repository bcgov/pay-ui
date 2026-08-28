/* eslint-disable max-len */
export default {
  page: {
    landing: {
      title: 'Pay - BC Government Services',
      h1: 'Preparing your payment...'
    },
    account: {
      title: 'Select Your Account or Create a New One',
      loading: 'Loading your accounts…',
      errors: {
        noPermission: 'You do not have permission to make payments on this account.',
        linkFailed: 'Unable to link this invoice. Please try again.'
      }
    },
    checkout: {
      title: 'Complete Your Payment',
      selectMethod: 'Select a Payment Method',
      method: {
        cc: 'Credit Card',
        ccSub: 'Pay with your credit card.',
        pad: 'Pre-Authorized Debit',
        padSub: 'Automatically debit a bank account when payments are due.',
        ob: 'Online Banking',
        obSub: 'Pay for products and services through your financial institution\'s website.'
      },
      feeSummary: 'Fee Summary',
      serviceFee: 'Service Fee',
      totalFees: 'Total Fees',
      back: 'Back',
      cancel: 'Cancel',
      confirmAndPay: 'Confirm and Pay',
      processing: 'Processing…',
      completeRequired: 'Please complete required information',
      pad: {
        loading: 'Checking your PAD account…',
        pendingTitle: 'PAD activation in progress',
        pendingBody: 'Your PAD account is being activated (typically 3 business days). Click "Confirm and Pay" below so this invoice is applied to the PAD once activation completes.',
        frozenTitle: 'PAD is currently frozen',
        frozenBody: 'Your PAD account is frozen. Please pick a different payment method or contact support to unfreeze it.',
        pendingEditLocked: 'Banking information can\'t be changed while activation is in progress. Please wait until activation completes to update these details.',
        setupRequiredBadge: 'Set up required',
        notSetUpBody: 'Pre-authorized Debit is not set up for this account. To enable this payment method, visit the ',
        notSetUpLink: 'products and payment page in the account settings',
        bankingInformation: 'Banking Information',
        bankingInfoHelp: 'These are the bank account details on file for this account\'s Pre-Authorized Debit.',
        edit: 'Edit'
      },
      errors: {
        methodSwitchFailed: 'Unable to update payment method. Please try again.',
        submitFailed: 'Unable to submit payment. Please try again.'
      }
    },
    return: {
      title: 'Processing payment...',
      h1: 'Processing your payment...',
      body: 'Please wait, this can take a few seconds.'
    },
    success: {
      title: 'Payment Successful',
      cc: {
        title: 'Payment Successful',
        body: 'Placeholder text that guides users on how to access their documents.',
        methodLabel: 'Payment method',
        amountLabel: 'Amount paid',
        downloadReceipt: 'Download Receipt'
      },
      pad: {
        title: 'Payment in Progress',
        methodLabel: 'Payment method',
        amountLabel: 'Amount paid',
        body1: '{amount} will be debited from your bank in 2-3 business days.',
        body2: 'Your receipt will become available once the debit is successful.'
      },
      ob: {
        title: 'Payment Pending',
        transactionAmount: 'Transaction Amount',
        balanceDue: 'Balance Due',
        description: 'Transaction will be completed when payment is received in full. Online Banking payment methods can expect between {days} for your payment.',
        daysRange: '2-5 days',
        payeeNameLabel: 'Payee Name',
        identifierLabel: 'Payment Identifier',
        identifierPending: 'Generating…',
        howToPayTitle: 'How to pay with online banking:',
        steps: {
          step1: 'Sign in to your financial institution\'s online banking website or app',
          step2: 'Go to the bill payment page',
          step3: 'Add {payee} as payee',
          step4: 'Enter this payment identifier as the account number: {identifier}',
          step5: 'Submit your payment for the balance due'
        },
        downloadInvoice: 'Download Invoice',
        completeNow: 'Would you like to complete transactions immediately?',
        payByCC: 'Pay by credit card',
        switching: 'Redirecting…'
      }
    },
    error: {
      invalidLink: 'This payment link is no longer valid.'
    }
  },
  padWidget: {
    title: 'Set up Pre-Authorized Debit',
    editTitle: 'Update banking information',
    editSubtitle: 'Updating banking information restarts the mandatory 3-business-day PAD confirmation period. All future PAD transactions on this account will use the new details.',
    confirmationPeriodBody: 'The Canadian Payment Association requires a 3-business-day confirmation period before your first PAD deduction. The account administrator will receive a written confirmation of the PAD agreement prior to the first deduction.',
    transit: 'Transit Number',
    transitHint: 'Minimum 4 digits',
    institution: 'Institution Number',
    institutionHint: 'Exactly 3 digits',
    account: 'Bank Account Number',
    accountHint: '7 to 12 digits',
    accountEditHint: 'To change, clear the field and re-enter the full account number.',
    tosPrefix: 'I have read, understood and agree to the',
    tosLinkLabel: 'Business Pre-Authorized Debit Terms and Conditions',
    tosSuffix: 'for BC Registry Services.',
    terms: {
      heading: 'Business Pre-Authorized Debit Terms and Conditions Agreement — BC Registries and Online Services',
      loading: 'Loading terms and conditions…',
      loadFailed: 'Unable to load the terms and conditions. Please close this dialog and try again.',
      scrollHint: 'Scroll to the bottom to enable "Agree to terms".',
      agreeButton: 'Agree to terms'
    },
    submit: 'Save banking information',
    updateSubmit: 'Update banking information',
    cancel: 'Cancel',
    submitting: 'Verifying…',
    errors: {
      transit: 'Transit Number must be at least 4 digits.',
      institution: 'Institution Number must be exactly 3 digits.',
      account: 'Account Number must be between 7 and 12 digits.',
      maskedDigits: 'Edited banking information should not contain masked digits (X). Clear the field and re-enter the full account number.',
      verifyFailed: 'Your bank information could not be verified. Please double-check and try again.',
      saveFailed: 'Unable to save your PAD information. Please try again.'
    }
  }
}
