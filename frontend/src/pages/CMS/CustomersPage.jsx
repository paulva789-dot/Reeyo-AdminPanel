// src/pages/CMS/CustomersPage.jsx
//
// This route used to render a second, mock-data-only customer list
// (StatCardGrid + CustomerTable + CustomerDetails) that duplicated
// Users/Customers/CustomerManagement.jsx. The admin-api has one /users
// resource, so both routes now render the same real implementation
// rather than maintaining two parallel customer UIs against it.
import CustomerManagement from '../Users/Customers/CustomerManagement';

const CustomersPage = () => <CustomerManagement />;

export default CustomersPage;
