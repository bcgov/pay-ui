export const productDisplay = {
  [Product.BCA]: 'BC Assessment',
  [Product.BUSINESS]: 'Business Registry & Name Request',
  [Product.BUSINESS_SEARCH]: 'Business and Person Search',
  [Product.CSO]: 'Court Services Online',
  [Product.ESRA]: 'Site Registry',
  [Product.MHR]: 'Manufactured Home Registry',
  [Product.PPR]: 'Personal Property Registry',
  [Product.RPPR]: 'Restricted Personal Property Registry',
  [Product.RPT]: 'Rural Property Tax',
  [Product.STRR]: 'Short-Term Rental Registry',
  [Product.VS]: 'Wills Registry',
  [Product.NRO]: 'Name Requests Online'
}
export const getProductDisplayName = (productCode: string): string => {
  return productDisplay[productCode as Product] || productCode
}
