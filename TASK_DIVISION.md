# Sourcing Dashboard - Task Division

**Developers:** M and F
**Timeline:** 8 Weeks
**Last Updated:** 2026-01-29

---

## Phase 1: Foundation (Weeks 1-3)

### Week 1

#### Days 1-2: Project Setup (M + F Together)
Both developers work together on initial setup:

| Task | Description |
|------|-------------|
| Create Next.js project | Initialize with App Router, TypeScript, Tailwind |
| Setup Prisma + PostgreSQL | Database connection and initial config |
| Design database schema | Create models together (User, Organization, Factory, Order, etc.) |
| Run first migration | Apply schema to database |
| Setup NextAuth.js | Basic email/password authentication |
| Create base layout | Header, sidebar, footer components |
| Setup shared types | TypeScript interfaces for all entities |

---

#### Days 3-5: Split Work

**M - Factory Management**
| Task | Description |
|------|-------------|
| Factory list page | `/factories` - Display all factories in a table |
| Factory create page | `/factories/new` - Form to add new factory |
| Factory detail page | `/factories/[id]` - View factory info |
| Factory edit page | `/factories/[id]/edit` - Update factory details |
| Factory API routes | CRUD endpoints for factories |
| Form validation | Zod schemas for factory forms |

**F - Order Management**
| Task | Description |
|------|-------------|
| Order list page | `/orders` - Display all orders with basic filters |
| Order create page | `/orders/new` - Form to create new order |
| Order detail page | `/orders/[id]` - View order info and stages |
| Order edit page | `/orders/[id]/edit` - Update order details |
| Order API routes | CRUD endpoints for orders |
| Order stages CRUD | Create/update production stages (cutting, sewing, etc.) |

---

### Week 2

**M - Dashboard Homepage**
| Task | Description |
|------|-------------|
| Dashboard page | `/dashboard` - Main landing page after login |
| Key metrics cards | Total orders, delayed orders, average progress |
| Orders by status chart | Simple status breakdown visualization |
| Recent activity feed | Show latest order updates |
| Quick action buttons | "Create Order", "Add Factory" shortcuts |
| Responsive layout | Mobile-friendly dashboard |

**F - Order Detail Enhancements**
| Task | Description |
|------|-------------|
| Progress bars for stages | Visual progress for each production stage |
| Order timeline | History of all updates on an order |
| File attachments | Upload/view/delete files on orders |
| Manual progress updates | Allow users to update stage progress |
| Notes/comments | Add notes to orders |

**M + F Together**
| Task | Description |
|------|-------------|
| Link orders to factories | Factory dropdown when creating orders |
| Show factory on order page | Display factory info on order detail |
| Show orders on factory page | List orders belonging to a factory |
| Search/filter orders | Filter by factory, status; search by order number |

---

### Week 3

**M - Team Management**
| Task | Description |
|------|-------------|
| User invitation flow | Invite team members via email |
| User roles system | Owner, Admin, Member, Viewer roles |
| Role-based permissions | Restrict actions based on user role |
| Team page UI | List team members, show roles |
| Invite/remove members | Admin can add/remove users |

**F - Advanced Filters & Export**
| Task | Description |
|------|-------------|
| Date range picker | Filter orders by date range |
| Multi-select filters | Select multiple statuses/factories |
| Priority filter | Filter by order priority |
| Progress range filter | Filter by progress percentage |
| Export to CSV | Download orders as CSV file |
| Export to Excel | Download orders as Excel file |
| Print-friendly view | Printable order detail page |

**M + F Together**
| Task | Description |
|------|-------------|
| Manual testing | Test all features end-to-end |
| Bug fixes | Fix issues found during testing |
| Mobile responsiveness | Ensure all pages work on mobile |
| Loading states | Add loading skeletons throughout |
| Deploy to Vercel | First production deployment |

---

## Phase 2: Visualization & Alerts (Weeks 4-5)

### Week 4

**M - Order Analytics**
| Task | Description |
|------|-------------|
| Install chart library | Setup recharts or Chart.js |
| Analytics API endpoints | Endpoints for chart data |
| Orders by status chart | Pie chart showing status breakdown |
| Progress over time chart | Line chart showing progress trends |
| Factory performance chart | Bar chart comparing factories |
| On-time vs delayed chart | Comparison visualization |
| Date range selector | Filter analytics by time period |

**F - Timeline Visualization**
| Task | Description |
|------|-------------|
| Gantt-style timeline | Visual timeline of all orders |
| Color coding by status | Different colors for different statuses |
| Hover details | Show order info on hover |
| Timeline filters | Filter which orders appear |
| Zoom controls | Zoom in/out on timeline |
| Export as image | Save timeline as PNG |
| Critical path highlighting | Highlight at-risk orders |

---

### Week 5

**M - Alert System**
| Task | Description |
|------|-------------|
| Alert generation logic | Detect delayed orders, stuck progress, etc. |
| Alert API endpoints | List, mark read, resolve alerts |
| Bell icon with badge | Show unread alert count |
| Alert list page | View all alerts |
| In-app notifications | Toast notifications for new alerts |

**F - Email Notifications**
| Task | Description |
|------|-------------|
| Setup email provider | Configure Resend or SendGrid |
| Email templates | Order delayed, completed, weekly digest |
| Notification preferences | User settings for email preferences |
| Send emails on alerts | Trigger emails when alerts created |
| Weekly digest job | Automated weekly summary email |

**M + F Together (Optional)**
| Task | Description |
|------|-------------|
| Real-time updates | WebSocket support for live updates |
| Push live changes | Update UI without page refresh |

---

## Phase 3: Automatic Integrations (Weeks 6-8)

### Week 6

**M - Integration Infrastructure**
| Task | Description |
|------|-------------|
| Setup Redis | Configure for job queue and caching |
| Setup BullMQ | Job queue for background sync tasks |
| Integration manager | Core logic for managing integrations |
| Adapter interface | Base class for all adapters |
| REST API adapter | First adapter implementation |
| Encryption utilities | Secure credential storage |
| Integration scheduler | Schedule sync jobs |

**F - Integration UI**
| Task | Description |
|------|-------------|
| Integration setup wizard | Multi-step form to configure integration |
| Choose integration type | Step 1: Select API, SFTP, Webhook, etc. |
| Enter credentials | Step 2: Input connection details |
| Test connection | Step 3: Verify connection works |
| Map data fields | Step 4: Map factory fields to our fields |
| Integration detail page | View status, logs, manual sync button |
| Integration logs viewer | Filter and view sync history |

---

### Week 7

**M - More Adapters**
| Task | Description |
|------|-------------|
| SFTP adapter | Connect via SFTP, download/parse files |
| Webhook receiver | Endpoint for factories to push data to us |
| SAP adapter | Integration for SAP systems |
| Oracle adapter | Integration for Oracle systems |

**F - Data Transformer & Validation**
| Task | Description |
|------|-------------|
| Field mapper UI | Configure how fields map between systems |
| Data validator | Validate incoming data, handle errors |
| Conflict resolution | Handle conflicts between synced and manual data |
| Sync indicator | Show "last synced" on orders |

---

### Week 8

**M - Monitoring & Observability**
| Task | Description |
|------|-------------|
| Setup Sentry | Error tracking for production |
| Add integration logging | Log all sync operations |
| Integration health dashboard | Admin view of all integration statuses |
| Failure alerting | Email admins when integrations fail repeatedly |

**F - Documentation**
| Task | Description |
|------|-------------|
| Factory setup guide | How factories create API credentials |
| Video tutorials | Screen recordings of setup process |
| Internal developer docs | How to add new adapters |

**M + F Together**
| Task | Description |
|------|-------------|
| Test with pilot factory #1 | Real integration testing |
| Test with pilot factory #2 | Test different system type |
| Load testing | Simulate many factories syncing |
| Final bug fixes | Address any remaining issues |
| Production launch | Final deployment and handoff |

---

## Summary by Developer

### M's Focus Areas
- Factory management (CRUD)
- Dashboard homepage
- Team management & permissions
- Charts & analytics
- Integration backend infrastructure
- Monitoring & observability

### F's Focus Areas
- Order management (CRUD)
- Order detail enhancements (timeline, attachments)
- Advanced filters & export
- Timeline visualization
- Email notifications
- Integration UI & documentation

---

## Priority Order

1. **Highest Priority (Week 1):** Project setup, authentication, basic CRUD for factories and orders
2. **High Priority (Week 2):** Dashboard, order stages/progress, linking factories to orders
3. **Medium Priority (Week 3):** Team management, advanced filters, export functionality
4. **Medium Priority (Week 4-5):** Charts, timeline, alerts, email notifications
5. **Lower Priority (Week 6-8):** Factory integrations (valuable but platform works without them)

---

## Notes

- Always communicate when starting/finishing tasks to avoid conflicts
- Use feature branches: `feature/factory-management`, `feature/order-crud`, etc.
- Merge to `main` frequently (at least daily)
- Test each other's features before merging
- If blocked, switch to a different task and communicate the blocker
