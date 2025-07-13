# Admin Dashboard - Shopify Authenticated

Complete administration interface for the NAD Test Cycle system using Shopify authentication.

## Authentication Method
- **Shopify Multipass**: Users authenticated through Shopify store
- **Role-Based Access**: Admin and Lab roles managed in Shopify
- **Auto-Redirect**: Unauthenticated users redirected to Shopify login

## Sections
- **overview.html**: Dashboard overview and system stats
- **tests.html**: Test management and activation
- **supplements.html**: Supplement database management  
- **analytics.html**: Analytics and reporting
- **system.html**: System health monitoring

## Removed Features
- ❌ **User Management**: Now handled entirely by Shopify
- ❌ **Local User Database**: Users managed in Shopify customer records
- ❌ **Role Assignment Interface**: Roles assigned in Shopify admin

## Shopify Integration
- **User Creation**: Done in Shopify admin panel
- **Role Management**: Shopify customer tags/metafields
- **Authentication**: Shopify Multipass + theme routing
- **Session Management**: Shopify-based sessions

## Access Control
- **Admin Role** → Full dashboard access
- **Lab Role** → Lab interface only  
- **Customer** → Customer portal only
- **Unauthenticated** → Redirect to Shopify
