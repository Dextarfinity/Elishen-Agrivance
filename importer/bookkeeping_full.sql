--
-- PostgreSQL database dump
--

\restrict H33URt5pYasjx4wI8pWoLfoCfaNxzcJ2uubVd6KoUFqATbj0udIe2Wyr3dJHQoj

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.sales DROP CONSTRAINT IF EXISTS sales_sales_rep_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales DROP CONSTRAINT IF EXISTS sales_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales DROP CONSTRAINT IF EXISTS sales_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sale_items DROP CONSTRAINT IF EXISTS sale_items_sale_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sale_items DROP CONSTRAINT IF EXISTS sale_items_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recurring_expenses DROP CONSTRAINT IF EXISTS recurring_expenses_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchases DROP CONSTRAINT IF EXISTS purchases_vendor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchases DROP CONSTRAINT IF EXISTS purchases_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchases DROP CONSTRAINT IF EXISTS purchases_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_sale_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.manual_inventory DROP CONSTRAINT IF EXISTS manual_inventory_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.items DROP CONSTRAINT IF EXISTS items_preferred_vendor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.expenses DROP CONSTRAINT IF EXISTS expenses_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.deliveries DROP CONSTRAINT IF EXISTS deliveries_sale_id_fkey;
ALTER TABLE IF EXISTS ONLY public.customer_advances DROP CONSTRAINT IF EXISTS customer_advances_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bom_lines DROP CONSTRAINT IF EXISTS bom_lines_finished_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bom_lines DROP CONSTRAINT IF EXISTS bom_lines_component_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.balance_entries DROP CONSTRAINT IF EXISTS balance_entries_account_id_fkey;
DROP INDEX IF EXISTS public.idx_sales_date;
DROP INDEX IF EXISTS public.idx_sales_customer;
DROP INDEX IF EXISTS public.idx_sale_items_item;
DROP INDEX IF EXISTS public.idx_purchases_item;
DROP INDEX IF EXISTS public.idx_payments_sale;
DROP INDEX IF EXISTS public.idx_expenses_date;
DROP INDEX IF EXISTS public.idx_deliveries_sale;
DROP INDEX IF EXISTS public.idx_audit_ts;
DROP INDEX IF EXISTS public.idx_att_ts;
DROP INDEX IF EXISTS public.customers_name_ux;
ALTER TABLE IF EXISTS ONLY public.vendors DROP CONSTRAINT IF EXISTS vendors_pkey;
ALTER TABLE IF EXISTS ONLY public.vendors DROP CONSTRAINT IF EXISTS vendors_name_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_name_key;
ALTER TABLE IF EXISTS ONLY public.store_visits DROP CONSTRAINT IF EXISTS store_visits_pkey;
ALTER TABLE IF EXISTS ONLY public.settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE IF EXISTS ONLY public.sales DROP CONSTRAINT IF EXISTS sales_sales_no_key;
ALTER TABLE IF EXISTS ONLY public.sales_reps DROP CONSTRAINT IF EXISTS sales_reps_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_reps DROP CONSTRAINT IF EXISTS sales_reps_name_key;
ALTER TABLE IF EXISTS ONLY public.sales DROP CONSTRAINT IF EXISTS sales_pkey;
ALTER TABLE IF EXISTS ONLY public.sale_items DROP CONSTRAINT IF EXISTS sale_items_pkey;
ALTER TABLE IF EXISTS ONLY public.recurring_expenses DROP CONSTRAINT IF EXISTS recurring_expenses_pkey;
ALTER TABLE IF EXISTS ONLY public.purchases DROP CONSTRAINT IF EXISTS purchases_pkey;
ALTER TABLE IF EXISTS ONLY public.profit_goals DROP CONSTRAINT IF EXISTS profit_goals_pkey;
ALTER TABLE IF EXISTS ONLY public.payroll_runs DROP CONSTRAINT IF EXISTS payroll_runs_pkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_or_no_key;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.notification_reads DROP CONSTRAINT IF EXISTS notification_reads_pkey;
ALTER TABLE IF EXISTS ONLY public.manual_inventory DROP CONSTRAINT IF EXISTS manual_inventory_pkey;
ALTER TABLE IF EXISTS ONLY public.items DROP CONSTRAINT IF EXISTS items_sku_key;
ALTER TABLE IF EXISTS ONLY public.items DROP CONSTRAINT IF EXISTS items_pkey;
ALTER TABLE IF EXISTS ONLY public.items DROP CONSTRAINT IF EXISTS items_name_key;
ALTER TABLE IF EXISTS ONLY public.financial_allocations DROP CONSTRAINT IF EXISTS financial_allocations_pkey;
ALTER TABLE IF EXISTS ONLY public.expenses DROP CONSTRAINT IF EXISTS expenses_pkey;
ALTER TABLE IF EXISTS ONLY public.deliveries DROP CONSTRAINT IF EXISTS deliveries_pkey;
ALTER TABLE IF EXISTS ONLY public.deliveries DROP CONSTRAINT IF EXISTS deliveries_dr_no_key;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE IF EXISTS ONLY public.customer_tiers DROP CONSTRAINT IF EXISTS customer_tiers_pkey;
ALTER TABLE IF EXISTS ONLY public.customer_tiers DROP CONSTRAINT IF EXISTS customer_tiers_customer_key;
ALTER TABLE IF EXISTS ONLY public.customer_advances DROP CONSTRAINT IF EXISTS customer_advances_pkey;
ALTER TABLE IF EXISTS ONLY public.claims DROP CONSTRAINT IF EXISTS claims_pkey;
ALTER TABLE IF EXISTS ONLY public.bom_lines DROP CONSTRAINT IF EXISTS bom_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.bom_lines DROP CONSTRAINT IF EXISTS bom_lines_finished_item_id_component_item_id_key;
ALTER TABLE IF EXISTS ONLY public.balance_entries DROP CONSTRAINT IF EXISTS balance_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_log DROP CONSTRAINT IF EXISTS audit_log_pkey;
ALTER TABLE IF EXISTS ONLY public.attendance DROP CONSTRAINT IF EXISTS attendance_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS accounts_name_key;
ALTER TABLE IF EXISTS public.vendors ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.store_visits ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sales_reps ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sales ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sale_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.recurring_expenses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.purchases ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.profit_goals ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payroll_runs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.manual_inventory ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.financial_allocations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.expenses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.deliveries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.customers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.customer_tiers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.customer_advances ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.claims ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.bom_lines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.balance_entries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_log ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.attendance ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.accounts ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.vendors_id_seq;
DROP VIEW IF EXISTS public.v_vendor_performance;
DROP TABLE IF EXISTS public.vendors;
DROP VIEW IF EXISTS public.v_sales_tax;
DROP VIEW IF EXISTS public.v_rep_commissions;
DROP VIEW IF EXISTS public.v_monthly_summary;
DROP VIEW IF EXISTS public.v_monthly_item_sales;
DROP VIEW IF EXISTS public.v_item_stock;
DROP VIEW IF EXISTS public.v_ar_by_customer;
DROP VIEW IF EXISTS public.v_accounts_receivable;
DROP VIEW IF EXISTS public.v_account_balances;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.store_visits_id_seq;
DROP TABLE IF EXISTS public.store_visits;
DROP TABLE IF EXISTS public.settings;
DROP SEQUENCE IF EXISTS public.sales_reps_id_seq;
DROP TABLE IF EXISTS public.sales_reps;
DROP SEQUENCE IF EXISTS public.sales_id_seq;
DROP TABLE IF EXISTS public.sales;
DROP SEQUENCE IF EXISTS public.sale_items_id_seq;
DROP TABLE IF EXISTS public.sale_items;
DROP SEQUENCE IF EXISTS public.recurring_expenses_id_seq;
DROP TABLE IF EXISTS public.recurring_expenses;
DROP SEQUENCE IF EXISTS public.purchases_id_seq;
DROP TABLE IF EXISTS public.purchases;
DROP SEQUENCE IF EXISTS public.profit_goals_id_seq;
DROP TABLE IF EXISTS public.profit_goals;
DROP SEQUENCE IF EXISTS public.payroll_runs_id_seq;
DROP TABLE IF EXISTS public.payroll_runs;
DROP SEQUENCE IF EXISTS public.payments_id_seq;
DROP TABLE IF EXISTS public.payments;
DROP SEQUENCE IF EXISTS public.notifications_id_seq;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.notification_reads;
DROP SEQUENCE IF EXISTS public.manual_inventory_id_seq;
DROP TABLE IF EXISTS public.manual_inventory;
DROP SEQUENCE IF EXISTS public.items_id_seq;
DROP TABLE IF EXISTS public.items;
DROP SEQUENCE IF EXISTS public.financial_allocations_id_seq;
DROP TABLE IF EXISTS public.financial_allocations;
DROP SEQUENCE IF EXISTS public.expenses_id_seq;
DROP TABLE IF EXISTS public.expenses;
DROP SEQUENCE IF EXISTS public.deliveries_id_seq;
DROP TABLE IF EXISTS public.deliveries;
DROP SEQUENCE IF EXISTS public.customers_id_seq;
DROP TABLE IF EXISTS public.customers;
DROP SEQUENCE IF EXISTS public.customer_tiers_id_seq;
DROP TABLE IF EXISTS public.customer_tiers;
DROP SEQUENCE IF EXISTS public.customer_advances_id_seq;
DROP TABLE IF EXISTS public.customer_advances;
DROP SEQUENCE IF EXISTS public.claims_id_seq;
DROP TABLE IF EXISTS public.claims;
DROP SEQUENCE IF EXISTS public.bom_lines_id_seq;
DROP TABLE IF EXISTS public.bom_lines;
DROP SEQUENCE IF EXISTS public.balance_entries_id_seq;
DROP TABLE IF EXISTS public.balance_entries;
DROP SEQUENCE IF EXISTS public.audit_log_id_seq;
DROP TABLE IF EXISTS public.audit_log;
DROP SEQUENCE IF EXISTS public.attendance_id_seq;
DROP TABLE IF EXISTS public.attendance;
DROP SEQUENCE IF EXISTS public.accounts_id_seq;
DROP TABLE IF EXISTS public.accounts;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    name text NOT NULL,
    beginning_balance numeric(14,2) DEFAULT 0 NOT NULL,
    last_checked date,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    user_name text NOT NULL,
    type text NOT NULL,
    ts timestamp with time zone DEFAULT now() NOT NULL,
    lat numeric(10,6),
    lng numeric(10,6),
    accuracy numeric(8,1),
    photo text
);


--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id integer NOT NULL,
    ts timestamp with time zone DEFAULT now() NOT NULL,
    user_name text,
    action text NOT NULL,
    detail text
);


--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- Name: balance_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.balance_entries (
    id integer NOT NULL,
    date date NOT NULL,
    ref_id text,
    account_id integer NOT NULL,
    amount numeric(14,2) NOT NULL,
    description text,
    remarks text,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: balance_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.balance_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: balance_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.balance_entries_id_seq OWNED BY public.balance_entries.id;


--
-- Name: bom_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bom_lines (
    id integer NOT NULL,
    finished_item_id integer NOT NULL,
    component_item_id integer NOT NULL,
    quantity numeric(14,4) NOT NULL,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: bom_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bom_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bom_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bom_lines_id_seq OWNED BY public.bom_lines.id;


--
-- Name: claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.claims (
    id integer NOT NULL,
    claim_type text DEFAULT 'Promo free goods'::text NOT NULL,
    period_from date,
    period_to date,
    qty numeric(14,3) DEFAULT 0 NOT NULL,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'Draft'::text NOT NULL,
    filed_date date,
    credited_date date,
    notes text,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: claims_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.claims_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: claims_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.claims_id_seq OWNED BY public.claims.id;


--
-- Name: customer_advances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_advances (
    id integer NOT NULL,
    customer text NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    amount numeric(14,2) NOT NULL,
    applied numeric(14,2) DEFAULT 0 NOT NULL,
    account_id integer,
    notes text,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: customer_advances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_advances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_advances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_advances_id_seq OWNED BY public.customer_advances.id;


--
-- Name: customer_tiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_tiers (
    id integer NOT NULL,
    customer text NOT NULL,
    tier text DEFAULT 'srp'::text NOT NULL
);


--
-- Name: customer_tiers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_tiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_tiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_tiers_id_seq OWNED BY public.customer_tiers.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text NOT NULL,
    address text,
    contact_no text,
    term text,
    tier text DEFAULT 'srp'::text NOT NULL,
    notes text,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deliveries (
    id integer NOT NULL,
    sale_id integer NOT NULL,
    dr_no text NOT NULL,
    date date NOT NULL,
    delivered_by text,
    vehicle text,
    status text DEFAULT 'Pending'::text NOT NULL,
    received_by text,
    delivered_date date,
    notes text,
    version integer DEFAULT 1 NOT NULL,
    signature text
);


--
-- Name: deliveries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.deliveries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: deliveries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.deliveries_id_seq OWNED BY public.deliveries.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    date date NOT NULL,
    ref_id text,
    category text NOT NULL,
    amount numeric(14,2) NOT NULL,
    tax numeric(14,2) DEFAULT 0 NOT NULL,
    shipping numeric(14,2) DEFAULT 0 NOT NULL,
    fees numeric(14,2) DEFAULT 0 NOT NULL,
    account_id integer,
    description text,
    remarks text,
    version integer DEFAULT 1 NOT NULL,
    receipt text
);


--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: financial_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_allocations (
    id integer NOT NULL,
    date date NOT NULL,
    user_name text NOT NULL,
    allocation text NOT NULL,
    old_rate numeric(8,4),
    new_rate numeric(8,4),
    remarks text,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: financial_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.financial_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: financial_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.financial_allocations_id_seq OWNED BY public.financial_allocations.id;


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id integer NOT NULL,
    name text NOT NULL,
    sku text,
    category text,
    type text DEFAULT 'Feed'::text NOT NULL,
    initial_stock numeric(14,3) DEFAULT 0 NOT NULL,
    minimum_stock numeric(14,3) DEFAULT 0 NOT NULL,
    sales_price numeric(14,4),
    cost numeric(14,4),
    preferred_vendor_id integer,
    units_in_purchase numeric(14,3),
    promotion text,
    notes text,
    deal text,
    outright_rate numeric(6,4) DEFAULT 0 NOT NULL,
    cod_rate numeric(6,4) DEFAULT 0 NOT NULL,
    price_breakdown jsonb,
    packaging text,
    uom text,
    srp_kilo numeric(14,4),
    dealer_srp numeric(14,4),
    dealers_acquisition numeric(14,4),
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: manual_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.manual_inventory (
    id integer NOT NULL,
    date date NOT NULL,
    batch_no text,
    item_id integer NOT NULL,
    qty numeric(14,3) NOT NULL,
    notes text,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: manual_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.manual_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: manual_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.manual_inventory_id_seq OWNED BY public.manual_inventory.id;


--
-- Name: notification_reads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_reads (
    user_name text NOT NULL,
    last_id integer DEFAULT 0 NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    ts timestamp with time zone DEFAULT now() NOT NULL,
    actor text,
    kind text,
    message text NOT NULL
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    sale_id integer NOT NULL,
    date date NOT NULL,
    amount numeric(14,2) NOT NULL,
    account_id integer,
    or_no text,
    notes text,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: payroll_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_runs (
    id integer NOT NULL,
    user_name text NOT NULL,
    period_from date NOT NULL,
    period_to date NOT NULL,
    days numeric(6,2) DEFAULT 0 NOT NULL,
    hours numeric(8,2) DEFAULT 0 NOT NULL,
    daily_rate numeric(12,2) DEFAULT 0 NOT NULL,
    gross_dtr numeric(12,2) DEFAULT 0 NOT NULL,
    commission numeric(12,2) DEFAULT 0 NOT NULL,
    sss numeric(12,2) DEFAULT 0 NOT NULL,
    philhealth numeric(12,2) DEFAULT 0 NOT NULL,
    pagibig numeric(12,2) DEFAULT 0 NOT NULL,
    other_ded numeric(12,2) DEFAULT 0 NOT NULL,
    net numeric(12,2) DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: payroll_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payroll_runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payroll_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payroll_runs_id_seq OWNED BY public.payroll_runs.id;


--
-- Name: profit_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profit_goals (
    id integer NOT NULL,
    year integer NOT NULL,
    goal text NOT NULL,
    achieved boolean DEFAULT false NOT NULL,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: profit_goals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.profit_goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profit_goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.profit_goals_id_seq OWNED BY public.profit_goals.id;


--
-- Name: purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchases (
    id integer NOT NULL,
    order_date date NOT NULL,
    received_date date,
    ref_id text,
    item_id integer NOT NULL,
    purchase_qty numeric(14,3) NOT NULL,
    received_qty numeric(14,3) DEFAULT 0 NOT NULL,
    unit_cost numeric(14,2) NOT NULL,
    account_id integer,
    status text DEFAULT 'Ordered'::text NOT NULL,
    vendor_id integer,
    notes text,
    version integer DEFAULT 1 NOT NULL,
    expiry_date date
);


--
-- Name: purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchases_id_seq OWNED BY public.purchases.id;


--
-- Name: recurring_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_expenses (
    id integer NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    amount numeric(14,2) NOT NULL,
    tax numeric(14,2) DEFAULT 0 NOT NULL,
    shipping numeric(14,2) DEFAULT 0 NOT NULL,
    fees numeric(14,2) DEFAULT 0 NOT NULL,
    account_id integer,
    day_of_month integer DEFAULT 1 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    last_posted date,
    version integer DEFAULT 1 NOT NULL,
    CONSTRAINT recurring_expenses_day_of_month_check CHECK (((day_of_month >= 1) AND (day_of_month <= 28)))
);


--
-- Name: recurring_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recurring_expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recurring_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recurring_expenses_id_seq OWNED BY public.recurring_expenses.id;


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_items (
    id integer NOT NULL,
    sale_id integer NOT NULL,
    item_id integer NOT NULL,
    qty numeric(14,3) NOT NULL,
    unit_price numeric(14,2) NOT NULL,
    total_price numeric(14,2) NOT NULL,
    discount numeric(14,4) DEFAULT 0 NOT NULL,
    promo boolean DEFAULT false NOT NULL
);


--
-- Name: sale_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sale_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_items_id_seq OWNED BY public.sale_items.id;


--
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales (
    id integer NOT NULL,
    sales_no text NOT NULL,
    date date NOT NULL,
    customer text NOT NULL,
    store_farm text,
    term text,
    due_date date,
    contact_no text,
    payment_mode text,
    account_id integer,
    sales_rep_id integer,
    subtotal numeric(14,2) DEFAULT 0 NOT NULL,
    tax_pct numeric(6,3) DEFAULT 0 NOT NULL,
    tax_amount numeric(14,2) DEFAULT 0 NOT NULL,
    discount_pct numeric(6,3) DEFAULT 0 NOT NULL,
    discount numeric(14,2) DEFAULT 0 NOT NULL,
    total numeric(14,2) DEFAULT 0 NOT NULL,
    amount_paid numeric(14,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'Completed'::text NOT NULL,
    customer_id integer,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_id_seq OWNED BY public.sales.id;


--
-- Name: sales_reps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_reps (
    id integer NOT NULL,
    name text NOT NULL,
    commission_rate numeric(6,4) DEFAULT 0 NOT NULL,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: sales_reps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_reps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_reps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_reps_id_seq OWNED BY public.sales_reps.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    key text NOT NULL,
    value text NOT NULL
);


--
-- Name: store_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_visits (
    id integer NOT NULL,
    user_name text NOT NULL,
    store_name text NOT NULL,
    ts timestamp with time zone DEFAULT now() NOT NULL,
    lat numeric(10,6),
    lng numeric(10,6),
    accuracy numeric(8,1),
    photo text,
    q_order text,
    q_products text,
    q_remarks text,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: store_visits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_visits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_visits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_visits_id_seq OWNED BY public.store_visits.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    roles text NOT NULL,
    pin text DEFAULT '1234'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    daily_rate numeric(12,2) DEFAULT 0 NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: v_account_balances; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_account_balances AS
 SELECT a.id,
    a.name,
    a.beginning_balance,
    COALESCE(dep.total, (0)::numeric) AS total_deposits,
    (COALESCE(wd.expenses, (0)::numeric) + COALESCE(wd2.purchases, (0)::numeric)) AS total_withdrawals,
    COALESCE(be.total, (0)::numeric) AS balance_adjustments,
    (((a.beginning_balance + COALESCE(dep.total, (0)::numeric)) + COALESCE(be.total, (0)::numeric)) - (COALESCE(wd.expenses, (0)::numeric) + COALESCE(wd2.purchases, (0)::numeric))) AS current_balance
   FROM ((((public.accounts a
     LEFT JOIN ( SELECT p.account_id,
            sum(p.amount) AS total
           FROM (public.payments p
             JOIN public.sales s ON ((s.id = p.sale_id)))
          WHERE (s.status !~~* '%cancel%'::text)
          GROUP BY p.account_id) dep ON ((dep.account_id = a.id)))
     LEFT JOIN ( SELECT expenses.account_id,
            sum((((expenses.amount - expenses.tax) + expenses.shipping) + expenses.fees)) AS expenses
           FROM public.expenses
          GROUP BY expenses.account_id) wd ON ((wd.account_id = a.id)))
     LEFT JOIN ( SELECT purchases.account_id,
            sum((purchases.purchase_qty * purchases.unit_cost)) AS purchases
           FROM public.purchases
          WHERE (purchases.status !~~* '%cancel%'::text)
          GROUP BY purchases.account_id) wd2 ON ((wd2.account_id = a.id)))
     LEFT JOIN ( SELECT balance_entries.account_id,
            sum(balance_entries.amount) AS total
           FROM public.balance_entries
          GROUP BY balance_entries.account_id) be ON ((be.account_id = a.id)));


--
-- Name: v_accounts_receivable; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_accounts_receivable AS
 SELECT id,
    sales_no,
    date,
    customer,
    store_farm,
    term,
    due_date,
    total,
    amount_paid,
    (total - amount_paid) AS balance,
    GREATEST(0, (CURRENT_DATE - COALESCE(due_date, date))) AS days_overdue
   FROM public.sales s
  WHERE ((status !~~* '%cancel%'::text) AND ((total - amount_paid) > (0)::numeric));


--
-- Name: v_ar_by_customer; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_ar_by_customer AS
 SELECT upper(TRIM(BOTH FROM customer)) AS customer_key,
    min(customer) AS customer,
    count(*) AS open_invoices,
    sum((total - amount_paid)) AS balance,
    max(GREATEST(0, (CURRENT_DATE - COALESCE(due_date, date)))) AS max_days_overdue
   FROM public.sales
  WHERE ((status !~~* '%cancel%'::text) AND ((total - amount_paid) > (0)::numeric))
  GROUP BY (upper(TRIM(BOTH FROM customer)));


--
-- Name: v_item_stock; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_item_stock AS
 SELECT i.id,
    i.name,
    i.sku,
    i.category,
    i.type,
    i.sales_price,
    i.cost,
    (i.sales_price - i.cost) AS profit,
        CASE
            WHEN (i.cost <> (0)::numeric) THEN round(((i.sales_price - i.cost) / i.cost), 4)
            ELSE NULL::numeric
        END AS margin,
    (((i.initial_stock + COALESCE(pr.received, (0)::numeric)) + COALESCE(mi.qty, (0)::numeric)) - COALESCE(sq.sold, (0)::numeric)) AS on_hand,
    i.minimum_stock,
    COALESCE(sq.sold, (0)::numeric) AS qty_sold,
        CASE
            WHEN ((((i.initial_stock + COALESCE(pr.received, (0)::numeric)) + COALESCE(mi.qty, (0)::numeric)) - COALESCE(sq.sold, (0)::numeric)) <= (0)::numeric) THEN 'Out of Stock'::text
            WHEN ((((i.initial_stock + COALESCE(pr.received, (0)::numeric)) + COALESCE(mi.qty, (0)::numeric)) - COALESCE(sq.sold, (0)::numeric)) <= i.minimum_stock) THEN 'Low Stock'::text
            ELSE 'In Stock'::text
        END AS status,
    i.deal,
    i.outright_rate,
    i.cod_rate,
    i.packaging,
    i.uom
   FROM (((public.items i
     LEFT JOIN ( SELECT purchases.item_id,
            sum(purchases.received_qty) AS received
           FROM public.purchases
          WHERE (purchases.status !~~* '%cancel%'::text)
          GROUP BY purchases.item_id) pr ON ((pr.item_id = i.id)))
     LEFT JOIN ( SELECT manual_inventory.item_id,
            sum(manual_inventory.qty) AS qty
           FROM public.manual_inventory
          GROUP BY manual_inventory.item_id) mi ON ((mi.item_id = i.id)))
     LEFT JOIN ( SELECT si.item_id,
            sum(si.qty) AS sold
           FROM (public.sale_items si
             JOIN public.sales s ON ((s.id = si.sale_id)))
          WHERE (s.status !~~* '%cancel%'::text)
          GROUP BY si.item_id) sq ON ((sq.item_id = i.id)));


--
-- Name: v_monthly_item_sales; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_monthly_item_sales AS
 SELECT si.item_id,
    i.name,
    to_char(date_trunc('month'::text, (s.date)::timestamp with time zone), 'YYYY-MM'::text) AS month,
    sum(si.qty) AS qty_sold,
    sum(si.total_price) AS revenue
   FROM ((public.sale_items si
     JOIN public.sales s ON (((s.id = si.sale_id) AND (s.status !~~* '%cancel%'::text))))
     JOIN public.items i ON ((i.id = si.item_id)))
  GROUP BY si.item_id, i.name, (to_char(date_trunc('month'::text, (s.date)::timestamp with time zone), 'YYYY-MM'::text));


--
-- Name: v_monthly_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_monthly_summary AS
 SELECT to_char((mo.month)::timestamp with time zone, 'YYYY-MM'::text) AS month,
    COALESCE(inc.total, (0)::numeric) AS total_income,
    COALESCE(exp.total, (0)::numeric) AS total_expenses,
    (COALESCE(inc.total, (0)::numeric) - COALESCE(exp.total, (0)::numeric)) AS profit_loss
   FROM ((( SELECT DISTINCT (date_trunc('month'::text, (t.d)::timestamp with time zone))::date AS month
           FROM ( SELECT sales.date AS d
                   FROM public.sales
                UNION ALL
                 SELECT expenses.date
                   FROM public.expenses) t) mo
     LEFT JOIN ( SELECT (date_trunc('month'::text, (sales.date)::timestamp with time zone))::date AS month,
            sum(sales.total) AS total
           FROM public.sales
          WHERE (sales.status !~~* '%cancel%'::text)
          GROUP BY ((date_trunc('month'::text, (sales.date)::timestamp with time zone))::date)) inc ON ((inc.month = mo.month)))
     LEFT JOIN ( SELECT (date_trunc('month'::text, (expenses.date)::timestamp with time zone))::date AS month,
            sum((((expenses.amount - expenses.tax) + expenses.shipping) + expenses.fees)) AS total
           FROM public.expenses
          GROUP BY ((date_trunc('month'::text, (expenses.date)::timestamp with time zone))::date)) exp ON ((exp.month = mo.month)))
  ORDER BY mo.month;


--
-- Name: v_rep_commissions; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_rep_commissions AS
 SELECT r.id,
    r.name,
    r.commission_rate,
    count(DISTINCT s.id) AS sales_count,
    COALESCE(sum(s.total), (0)::numeric) AS total_sales,
    round((COALESCE(sum(s.total), (0)::numeric) * r.commission_rate), 2) AS commission
   FROM (public.sales_reps r
     LEFT JOIN public.sales s ON (((s.sales_rep_id = r.id) AND (s.status !~~* '%cancel%'::text))))
  GROUP BY r.id, r.name, r.commission_rate;


--
-- Name: v_sales_tax; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_sales_tax AS
 SELECT to_char((m.month)::timestamp with time zone, 'YYYY-MM'::text) AS month,
    COALESCE(c.collected, (0)::numeric) AS tax_collected,
    COALESCE(p.paid, (0)::numeric) AS tax_paid,
    (COALESCE(c.collected, (0)::numeric) - COALESCE(p.paid, (0)::numeric)) AS difference
   FROM ((( SELECT DISTINCT (date_trunc('month'::text, (t.d)::timestamp with time zone))::date AS month
           FROM ( SELECT sales.date AS d
                   FROM public.sales
                UNION ALL
                 SELECT expenses.date
                   FROM public.expenses) t) m
     LEFT JOIN ( SELECT (date_trunc('month'::text, (sales.date)::timestamp with time zone))::date AS month,
            sum(sales.tax_amount) AS collected
           FROM public.sales
          WHERE (sales.status !~~* '%cancel%'::text)
          GROUP BY ((date_trunc('month'::text, (sales.date)::timestamp with time zone))::date)) c ON ((c.month = m.month)))
     LEFT JOIN ( SELECT (date_trunc('month'::text, (expenses.date)::timestamp with time zone))::date AS month,
            sum(expenses.tax) AS paid
           FROM public.expenses
          GROUP BY ((date_trunc('month'::text, (expenses.date)::timestamp with time zone))::date)) p ON ((p.month = m.month)))
  ORDER BY (to_char((m.month)::timestamp with time zone, 'YYYY-MM'::text));


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendors (
    id integer NOT NULL,
    name text NOT NULL,
    contact_name text,
    phone text,
    email text,
    address text,
    country text,
    notes text,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: v_vendor_performance; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_vendor_performance AS
 SELECT v.id,
    v.name,
    count(p.id) AS orders,
    sum((p.purchase_qty * p.unit_cost)) AS total_spent,
    round(avg((p.received_date - p.order_date)), 1) AS avg_shipping_days
   FROM (public.vendors v
     LEFT JOIN public.purchases p ON (((p.vendor_id = v.id) AND (p.status !~~* '%cancel%'::text))))
  GROUP BY v.id, v.name;


--
-- Name: vendors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vendors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vendors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vendors_id_seq OWNED BY public.vendors.id;


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- Name: balance_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance_entries ALTER COLUMN id SET DEFAULT nextval('public.balance_entries_id_seq'::regclass);


--
-- Name: bom_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_lines ALTER COLUMN id SET DEFAULT nextval('public.bom_lines_id_seq'::regclass);


--
-- Name: claims id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claims ALTER COLUMN id SET DEFAULT nextval('public.claims_id_seq'::regclass);


--
-- Name: customer_advances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_advances ALTER COLUMN id SET DEFAULT nextval('public.customer_advances_id_seq'::regclass);


--
-- Name: customer_tiers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_tiers ALTER COLUMN id SET DEFAULT nextval('public.customer_tiers_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: deliveries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries ALTER COLUMN id SET DEFAULT nextval('public.deliveries_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: financial_allocations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_allocations ALTER COLUMN id SET DEFAULT nextval('public.financial_allocations_id_seq'::regclass);


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: manual_inventory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manual_inventory ALTER COLUMN id SET DEFAULT nextval('public.manual_inventory_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: payroll_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_runs ALTER COLUMN id SET DEFAULT nextval('public.payroll_runs_id_seq'::regclass);


--
-- Name: profit_goals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profit_goals ALTER COLUMN id SET DEFAULT nextval('public.profit_goals_id_seq'::regclass);


--
-- Name: purchases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases ALTER COLUMN id SET DEFAULT nextval('public.purchases_id_seq'::regclass);


--
-- Name: recurring_expenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses ALTER COLUMN id SET DEFAULT nextval('public.recurring_expenses_id_seq'::regclass);


--
-- Name: sale_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items ALTER COLUMN id SET DEFAULT nextval('public.sale_items_id_seq'::regclass);


--
-- Name: sales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales ALTER COLUMN id SET DEFAULT nextval('public.sales_id_seq'::regclass);


--
-- Name: sales_reps id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_reps ALTER COLUMN id SET DEFAULT nextval('public.sales_reps_id_seq'::regclass);


--
-- Name: store_visits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_visits ALTER COLUMN id SET DEFAULT nextval('public.store_visits_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vendors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors ALTER COLUMN id SET DEFAULT nextval('public.vendors_id_seq'::regclass);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts (id, name, beginning_balance, last_checked, version) FROM stdin;
4	Cash	0.00	\N	1
5	Gcash	0.00	\N	1
6	RCBC Bank Account	0.00	\N	1
7	BDO Bank Account	0.00	\N	1
8	Petty Cash	0.00	\N	1
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance (id, user_name, type, ts, lat, lng, accuracy, photo) FROM stdin;
6	Glomer Celestino	Time in	2026-08-05 23:16:44.608701+08	8.977978	125.602282	100.0	data:image/jpeg;base64,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
7	Glomer Celestino	Time out	2026-08-05 23:24:04.913888+08	8.977992	125.602278	14.3	data:image/jpeg;base64,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
14	Glomer Celestino	Time in	2026-08-06 13:57:17.359744+08	8.977944	125.602262	14.3	data:image/jpeg;base64,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
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_log (id, ts, user_name, action, detail) FROM stdin;
1	2026-08-05 13:37:10.352419+08	Glomer Celestino	POST /attendance	{"user_name":"Glomer Celestino","type":"Time in","lat":null,"lng":null,"accuracy":null}
2	2026-08-05 13:37:11.797282+08	Glomer Celestino	POST /attendance	{"user_name":"Romel Nabong","type":"Time in","lat":8.9475,"lng":125.5406,"accuracy":12}
3	2026-08-05 13:37:40.192215+08	Glomer Celestino	PUT /deliveries/80	{"status":"Delivered","received_by":"TEST RECEIVER","delivered_date":"2026-08-05"}
4	2026-08-05 13:48:09.815535+08	Romel Nabong	DELETE /sales/9999	{}
5	2026-08-05 13:48:10.097666+08	Romel Nabong	PUT /items/49	{"cost":1}
6	2026-08-05 13:48:10.349471+08	Romel Nabong	PUT /payments/1	{"amount":1,"date":"2026-08-05"}
7	2026-08-05 13:48:10.615628+08	Romel Nabong	PUT /deliveries/999999	{"status":"Delivered"}
8	2026-08-05 13:48:10.857134+08	Glomer Celestino	PUT /claims/9999	{"notes":null}
9	2026-08-05 13:48:26.271009+08	Romel Nabong	POST /sales	{"sales_no":"RBAC-TEST-1","date":"2026-08-05","customer":"Tomba Store","subtotal":100,"tax_pct":0,"tax_amount":0,"discount_pct":0,"discount":0,"total":100,"amount_paid":0,"status":"Completed","items":"1 line(s)"}
10	2026-08-05 13:49:34.20631+08	Glomer Celestino	PUT /sales/97	{"status":"Completed"}
11	2026-08-05 13:49:36.016935+08	Glomer Celestino	DELETE /sales/97	{}
12	2026-08-05 13:52:29.418734+08	Glomer Celestino	POST /change_pin	{"user_id":1,"old_pin":"1234","new_pin":"5678"}
13	2026-08-05 13:52:30.322539+08	Glomer Celestino	POST /change_pin	{"user_id":1,"old_pin":"5678","new_pin":"1234"}
14	2026-08-05 13:59:45.835482+08	Romel Nabong	POST /sales/96/payments	{"amount":500,"date":"2026-08-05","notes":"NOTIF-TEST partial"}
16	2026-08-05 13:59:49.284397+08	Glomer Celestino	DELETE /payments/67	{}
17	2026-08-05 14:02:39.749379+08	Glomer Celestino	POST /attendance	{"user_name":"Glomer Celestino","type":"Time in","lat":null,"lng":null,"accuracy":null}
18	2026-08-05 14:16:25.161898+08	Glomer Celestino	POST /attendance	{"user_name":"Glomer Celestino","type":"Time out","photo":null,"lat":null,"lng":null,"accuracy":null}
19	2026-08-05 14:16:27.680386+08	Romel Nabong	POST /attendance	{"user_name":"Romel Nabong","type":"Time in","lat":8.9475,"lng":125.5406,"accuracy":10,"photo":"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaA
20	2026-08-05 14:16:27.696094+08	Romel Nabong	POST /attendance	{"user_name":"Romel Nabong","type":"Time out","photo":"data:image/png;base64,iVBORw0KGgo="}
21	2026-08-05 23:16:44.601065+08	Glomer Celestino	POST /attendance	{"user_name":"Glomer Celestino","type":"Time in","photo":"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAA
22	2026-08-05 23:24:04.908382+08	Glomer Celestino	POST /attendance	{"user_name":"Glomer Celestino","type":"Time out","photo":"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZA
23	2026-08-06 00:13:08.602908+08	Glomer Celestino	PUT /users/6	{"daily_rate":480}
24	2026-08-06 00:13:11.582706+08	Glomer Celestino	PUT /users/6	{"daily_rate":0}
25	2026-08-06 00:31:23.597451+08	Glomer Celestino	POST /expenses	{"date":"2026-08-06","category":"Utilities","amount":150,"tax":0,"shipping":0,"fees":0,"description":"RECEIPT-TEST electric bill"}
26	2026-08-06 00:31:23.654196+08	Glomer Celestino	PUT /expenses/9	{"receipt":"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABj
27	2026-08-06 00:31:26.578308+08	Glomer Celestino	DELETE /expenses/9	{}
28	2026-08-06 00:32:30.270416+08	Renante Mahinay	POST /attendance	{"user_name":"Renante Mahinay","type":"Time in"}
29	2026-08-06 00:32:30.577159+08	Renante Mahinay	POST /attendance	{"user_name":"Renante Mahinay","type":"Time out"}
30	2026-08-06 00:32:30.587439+08	Glomer Celestino	PUT /users/8	{"daily_rate":500}
31	2026-08-06 00:32:34.578193+08	Glomer Celestino	POST /payroll_runs	{"user_name":"Renante Mahinay","period_from":"2026-08-01","period_to":"2026-08-06","days":1,"hours":0,"daily_rate":500,"gross_dtr":500,"commission":0,"sss":45,"philhealth":25,"pagibig":10,"other_ded":0,"net":420,"notes":null}
32	2026-08-06 00:32:39.564194+08	Glomer Celestino	DELETE /payroll_runs/1	{}
33	2026-08-06 00:32:39.571304+08	Glomer Celestino	PUT /users/8	{"daily_rate":0}
34	2026-08-06 13:57:17.353413+08	Glomer Celestino	POST /attendance	{"user_name":"Glomer Celestino","type":"Time in","photo":"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAA
35	2026-08-09 02:53:06.756597+08	Glomer Celestino	POST /manual_inventory	{"date":"2026-08-08","batch_no":"STOCKTAKE-2026-08-08","item_id":109,"qty":-1,"notes":"Stock take adjustment"}
36	2026-08-09 02:57:40.855303+08	Romel Nabong	POST /store_visits	{"user_name":"Romel Nabong","store_name":"Greenfield Agrivet Supply","photo":null,"q_order":"TEST — Ordered 10 bags UNO+ Grower, fast moving","q_products":"TEST — 5 bags Stargain left, Spectrum out of stock","q_remarks":"TEST — revisit Friday","lat":8.9512,"lng":125.532,"accuracy":15}
37	2026-08-09 02:58:03.030246+08	Glomer Celestino	DELETE /store_visits/1	{}
38	2026-08-09 19:07:54.955604+08	Glomer Celestino	POST /sales/87/payments	{"amount":4340,"date":"2026-08-01","account_id":6,"notes":"UnionBank check #0000122878"}
39	2026-08-09 19:07:55.435128+08	Glomer Celestino	POST /sales/90/payments	{"amount":6460,"date":"2026-08-04","account_id":6,"notes":"UnionBank check #0000122879"}
40	2026-08-09 19:07:56.013902+08	Glomer Celestino	PUT /payments/52	{"amount":56300,"date":"2026-08-07","account_id":6,"notes":"RCBC check #0009011172 � Thessa Rice and Corn Retailer (eWMN) � masterlist marked PAID, check received 08-07"}
41	2026-08-09 19:10:00.067016+08	Glomer Celestino	PUT /payments/56	{"date":"2026-07-17","amount":20130,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
42	2026-08-09 19:10:04.439793+08	Glomer Celestino	PUT /payments/55	{"date":"2026-07-15","amount":4440,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
43	2026-08-09 19:10:08.359602+08	Glomer Celestino	PUT /payments/54	{"date":"2026-07-11","amount":6700,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
44	2026-08-09 19:10:11.700261+08	Glomer Celestino	PUT /payments/53	{"date":"2026-07-09","amount":43400,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
48	2026-08-09 19:10:26.7085+08	Glomer Celestino	PUT /payments/48	{"date":"2026-07-03","amount":24500,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
52	2026-08-09 19:10:45.099824+08	Glomer Celestino	PUT /payments/46	{"date":"2026-06-30","amount":8580,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
55	2026-08-09 19:10:55.846521+08	Glomer Celestino	PUT /payments/43	{"date":"2026-06-24","amount":1905,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
45	2026-08-09 19:10:15.085049+08	Glomer Celestino	PUT /payments/51	{"date":"2026-07-07","amount":7852,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
46	2026-08-09 19:10:18.860206+08	Glomer Celestino	PUT /payments/50	{"date":"2026-07-04","amount":29150,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
47	2026-08-09 19:10:23.253241+08	Glomer Celestino	PUT /payments/49	{"date":"2026-07-03","amount":7000,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
49	2026-08-09 19:10:30.307317+08	Glomer Celestino	PUT /payments/47	{"date":"2026-06-30","amount":3700,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
50	2026-08-09 19:10:36.248929+08	Glomer Celestino	PUT /payments/13	{"date":"2026-05-20","amount":11000,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
51	2026-08-09 19:10:41.532302+08	Glomer Celestino	PUT /payments/14	{"date":"2026-05-20","amount":31715,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
53	2026-08-09 19:10:48.491398+08	Glomer Celestino	PUT /payments/45	{"date":"2026-06-29","amount":29525,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
54	2026-08-09 19:10:52.028268+08	Glomer Celestino	PUT /payments/44	{"date":"2026-06-26","amount":11500,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
56	2026-08-09 19:10:59.35337+08	Glomer Celestino	PUT /payments/42	{"date":"2026-06-24","amount":48880,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
57	2026-08-09 19:11:03.383057+08	Glomer Celestino	PUT /payments/41	{"date":"2026-06-20","amount":29510,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
58	2026-08-09 19:11:07.519468+08	Glomer Celestino	PUT /payments/40	{"date":"2026-06-20","amount":11290,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
59	2026-08-09 19:11:11.414257+08	Glomer Celestino	PUT /payments/39	{"date":"2026-06-20","amount":6450,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
60	2026-08-09 19:11:15.195667+08	Glomer Celestino	PUT /payments/38	{"date":"2026-06-20","amount":6200,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
61	2026-08-09 19:11:18.63818+08	Glomer Celestino	PUT /payments/37	{"date":"2026-06-17","amount":1785,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
62	2026-08-09 19:11:22.780406+08	Glomer Celestino	PUT /payments/36	{"date":"2026-06-17","amount":30437,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
63	2026-08-09 19:11:26.643059+08	Glomer Celestino	PUT /payments/35	{"date":"2026-06-16","amount":43050,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
64	2026-08-09 19:11:32.797244+08	Glomer Celestino	PUT /payments/58	{"date":"2026-05-20","amount":10380,"account_id":"4","or_no":null,"notes":"Checked masterlist — DR tracked (blue), marked PAID","version":1}
65	2026-08-09 19:11:37.331232+08	Glomer Celestino	PUT /payments/34	{"date":"2026-06-16","amount":13480,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
66	2026-08-09 19:11:42.060525+08	Glomer Celestino	PUT /payments/33	{"date":"2026-06-16","amount":1100,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
67	2026-08-09 19:11:46.369315+08	Glomer Celestino	PUT /payments/32	{"date":"2026-06-08","amount":5355,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
68	2026-08-09 19:11:50.916728+08	Glomer Celestino	PUT /payments/31	{"date":"2026-06-08","amount":34140,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
69	2026-08-09 19:11:56.064614+08	Glomer Celestino	PUT /payments/30	{"date":"2026-06-04","amount":14690,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
70	2026-08-09 19:12:00.673382+08	Glomer Celestino	PUT /payments/29	{"date":"2026-06-04","amount":23205,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
71	2026-08-09 19:13:22.970012+08	Glomer Celestino	PUT /payments/28	{"date":"2026-06-04","amount":28700,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
72	2026-08-09 19:13:27.557073+08	Glomer Celestino	PUT /payments/27	{"date":"2026-06-01","amount":19600,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
73	2026-08-09 19:13:32.07311+08	Glomer Celestino	PUT /payments/26	{"date":"2026-05-28","amount":22430,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
74	2026-08-09 19:13:37.206197+08	Glomer Celestino	PUT /payments/25	{"date":"2026-05-28","amount":4630,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
75	2026-08-09 19:13:41.55358+08	Glomer Celestino	PUT /payments/24	{"date":"2026-05-28","amount":13680,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
76	2026-08-09 19:13:45.470341+08	Glomer Celestino	PUT /payments/23	{"date":"2026-05-28","amount":2280,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
77	2026-08-09 19:13:50.323338+08	Glomer Celestino	PUT /payments/22	{"date":"2026-05-28","amount":27360,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
78	2026-08-09 19:13:55.364872+08	Glomer Celestino	PUT /payments/61	{"date":"2026-05-26","amount":19100,"account_id":"4","or_no":null,"notes":"Checked masterlist — DR tracked (blue), marked PAID","version":1}
79	2026-08-09 19:14:05.61337+08	Glomer Celestino	PUT /payments/21	{"date":"2026-05-26","amount":4560,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
80	2026-08-09 19:14:46.185213+08	Glomer Celestino	PUT /payments/15	{"date":"2026-05-22","amount":5100,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
81	2026-08-09 19:14:50.897185+08	Glomer Celestino	PUT /payments/20	{"date":"2026-05-26","amount":14995,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
82	2026-08-09 19:14:55.897601+08	Glomer Celestino	PUT /payments/19	{"date":"2026-05-26","amount":4360,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
83	2026-08-09 19:15:00.982153+08	Glomer Celestino	PUT /payments/18	{"date":"2026-05-25","amount":1855,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
84	2026-08-09 19:15:06.592341+08	Glomer Celestino	PUT /payments/17	{"date":"2026-05-25","amount":28015,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
85	2026-08-09 19:15:11.469149+08	Glomer Celestino	PUT /payments/16	{"date":"2026-05-23","amount":10485,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
86	2026-08-09 19:15:16.654176+08	Glomer Celestino	PUT /payments/60	{"date":"2026-05-22","amount":1160,"account_id":"4","or_no":null,"notes":"Checked masterlist — DR tracked (blue), marked PAID","version":1}
87	2026-08-09 19:15:21.900737+08	Glomer Celestino	PUT /payments/59	{"date":"2026-05-22","amount":80270,"account_id":"4","or_no":null,"notes":"Checked masterlist — DR tracked (blue), marked PAID","version":1}
88	2026-08-09 19:15:28.277683+08	Glomer Celestino	PUT /payments/11	{"date":"2026-05-16","amount":23700,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
90	2026-08-09 19:15:35.188387+08	Glomer Celestino	PUT /payments/57	{"date":"2026-05-15","amount":68020,"account_id":"4","or_no":null,"notes":"Checked masterlist — DR tracked (blue), marked PAID","version":1}
89	2026-08-09 19:15:31.305286+08	Glomer Celestino	PUT /payments/10	{"date":"2026-05-16","amount":26265,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
91	2026-08-09 19:15:37.717988+08	Glomer Celestino	PUT /payments/12	{"date":"2026-05-15","amount":18000,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
92	2026-08-09 19:15:40.725426+08	Glomer Celestino	PUT /payments/9	{"date":"2026-05-14","amount":14255,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
93	2026-08-09 19:15:43.029254+08	Glomer Celestino	PUT /payments/8	{"date":"2026-05-14","amount":9650,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
94	2026-08-09 19:15:45.601411+08	Glomer Celestino	PUT /payments/7	{"date":"2026-05-14","amount":8100,"account_id":"4","or_no":null,"notes":"Masterlist import — marked PAID (account not recorded)","version":1}
95	2026-08-09 19:16:59.356237+08	Glomer Celestino	POST /transfer	{"from_account_id":4,"to_account_id":6,"amount":1}
96	2026-08-09 19:16:59.623676+08	Glomer Celestino	POST /expenses	{"date":"2026-08-08","category":"Test","amount":1}
97	2026-08-09 19:16:59.883658+08	Henry Benjamin Cuyuca	POST /transfer	{"from_account_id":4,"to_account_id":8,"amount":250,"date":"2026-08-08","description":"Petty cash top-up (test)"}
98	2026-08-09 19:17:23.449938+08	Henry Benjamin Cuyuca	DELETE /balance_entries/2	{}
99	2026-08-09 19:17:47.151856+08	Henry Benjamin Cuyuca	DELETE /balance_entries/1	{}
100	2026-08-09 19:21:17.961154+08	Glomer Celestino	LOGIN FAILED	wrong PIN from 127.0.0.1
101	2026-08-09 19:21:18.214413+08	Glomer Celestino	LOGIN FAILED	wrong PIN from 127.0.0.1
102	2026-08-09 19:21:18.468185+08	Glomer Celestino	LOGIN FAILED	wrong PIN from 127.0.0.1
103	2026-08-09 19:21:18.730908+08	Glomer Celestino	LOGIN FAILED	wrong PIN from 127.0.0.1
104	2026-08-09 19:21:18.983242+08	Glomer Celestino	LOGIN FAILED	wrong PIN from 127.0.0.1
105	2026-08-09 19:21:19.242129+08	Glomer Celestino	LOGIN FAILED	wrong PIN from 127.0.0.1
106	2026-08-09 19:21:19.502234+08	Glomer Celestino	LOGIN FAILED	wrong PIN from 127.0.0.1
107	2026-08-09 19:21:19.760426+08	Glomer Celestino	LOGIN FAILED	wrong PIN from 127.0.0.1
108	2026-08-09 19:21:20.015249+08	Glomer Celestino	LOGIN FAILED	wrong PIN from 127.0.0.1
109	2026-08-09 19:21:20.276187+08	Glomer Celestino	LOGIN FAILED	wrong PIN from 127.0.0.1
110	2026-08-09 19:22:18.50606+08	Henry Benjamin Cuyuca	POST /claims	{"claim_type":"Other","amount":1,"status":"Draft","notes":"TOAST-TEST"}
111	2026-08-09 19:22:18.917848+08	Henry Benjamin Cuyuca	PUT /claims/2	{"notes":"DUP","amount":1}
112	2026-08-09 19:22:18.926973+08	Henry Benjamin Cuyuca	DELETE /claims/2	{}
113	2026-08-09 19:22:20.350515+08	Henry Benjamin Cuyuca	POST /change_pin	{"user_id":2,"old_pin":"9999","new_pin":"5555"}
114	2026-08-09 19:23:22.381492+08	Henry Benjamin Cuyuca	POST /change_pin	{"user_id":2,"old_pin":"9999","new_pin":"5555"}
115	2026-08-09 19:34:54.919058+08	Henry Benjamin Cuyuca	POST /customer_advances	{"customer":"Po Tropical","date":"2026-08-07","amount":17600,"account_id":6,"notes":"Metrobank check #1423313369 � no matching invoice yet"}
116	2026-08-09 19:34:55.22109+08	Henry Benjamin Cuyuca	POST /customer_advances	{"customer":"Urban Paws","date":"2026-08-06","amount":2652,"account_id":6,"notes":"UnionBank check #0000122876 � no matching invoice yet"}
117	2026-08-09 19:35:55.228206+08	Henry Benjamin Cuyuca	POST /attendance	{"user_name":"Henry Benjamin Cuyuca","type":"Time in"}
\.


--
-- Data for Name: balance_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.balance_entries (id, date, ref_id, account_id, amount, description, remarks, version) FROM stdin;
\.


--
-- Data for Name: bom_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bom_lines (id, finished_item_id, component_item_id, quantity, version) FROM stdin;
\.


--
-- Data for Name: claims; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.claims (id, claim_type, period_from, period_to, qty, amount, status, filed_date, credited_date, notes, version) FROM stdin;
\.


--
-- Data for Name: customer_advances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_advances (id, customer, date, amount, applied, account_id, notes, version) FROM stdin;
1	Po Tropical	2026-08-07	17600.00	0.00	6	Metrobank check #1423313369 � no matching invoice yet	1
2	Urban Paws	2026-08-06	2652.00	0.00	6	UnionBank check #0000122876 � no matching invoice yet	1
\.


--
-- Data for Name: customer_tiers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_tiers (id, customer, tier) FROM stdin;
1	Greenfield Agrivet Supply	outright
2	0919 Agrivet	srp
3	2NK	srp
4	2NK Agrivet	srp
5	ACM Agrivet	srp
6	Alben Macabuhay	srp
7	Alphadog	srp
8	Azote Store	srp
9	Dan Beros	srp
10	Dhudz Nangcas	srp
11	Divine Mercy Adorable	srp
12	Dream Feeders Agrivet	srp
13	Fegen Gines	srp
14	Furtastic Pet Care Services	srp
15	Golden Sunrise Agrivet	srp
16	Gorgonio Agrivet	srp
17	Ian Kenneth Varela	srp
18	Janelle Kyle Agri Trading	srp
19	Jerome Racaza	srp
20	Jessie Jhon Malias	srp
21	Jessie Lua	srp
22	John Ford Magtagad	srp
23	Johnny Porras	srp
24	Johnped Diacor	srp
25	Jojie Maramara	srp
26	JPT Rice and Feeds Retailing	srp
27	M&N Agrivet	srp
28	Madat Agrivet	srp
29	Mazaua Pet Shop	srp
30	NP Intino	srp
31	Obud Store	srp
32	PLK Pet Shop	srp
33	PLK Petshop	srp
34	Po Tropical	srp
35	The Hobby Company Pet Shop	srp
36	Tomba Store	srp
37	Urban Paws	srp
38	WRM	srp
39	WRM Agrivet & Pet Shop	srp
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, name, address, contact_no, term, tier, notes, version) FROM stdin;
1	0919 Agrivet	Butuan City	\N	Credit	srp	\N	1
2	2NK	San Vicente, Butuan City	\N	\N	srp	\N	1
3	2NK Agrivet	San Vicente, Butuan City	\N	Credit	srp	\N	1
4	ACM Agrivet	Libertad, Butuan City	\N	Credit	srp	\N	1
5	Alben Macabuhay	Villakananga, Butuan City	\N	\N	srp	\N	1
6	Alphadog	Butuan City	\N	\N	srp	\N	1
7	Azote Store	Butuan City	\N	Credit	srp	\N	1
8	Dan Beros	Nasipit, Ag Nor	\N	\N	srp	\N	1
9	Dhudz Nangcas	Las Nieves	\N	\N	srp	\N	1
10	Divine Mercy Adorable	Los Angeles, Butuan City	\N	\N	srp	\N	1
11	Dream Feeders Agrivet	Tiniwisan, Butuan City	\N	\N	srp	\N	1
12	Fegen Gines	Butuan City	\N	\N	srp	\N	1
13	Furtastic Pet Care Services	Cabadbaran City	\N	Credit	srp	\N	1
14	Golden Sunrise Agrivet	RTR, Ag Nor	\N	\N	srp	\N	1
15	Gorgonio Agrivet	Maug, Butuan City	\N	Credit	srp	\N	1
17	Ian Kenneth Varela	\N	\N	\N	srp	\N	1
18	Janelle Kyle Agri Trading	Butuan City	\N	Credit	srp	\N	1
19	Jerome Racaza	La Union, Cabadbaran City	\N	\N	srp	\N	1
20	Jessie Jhon Malias	RTR, Ag Nor	\N	Credit	srp	\N	1
21	Jessie Lua	Butuan City	\N	Credit	srp	\N	1
22	John Ford Magtagad	\N	\N	\N	srp	\N	1
23	Johnny Porras	Davao City	\N	\N	srp	\N	1
24	Johnped Diacor	\N	\N	\N	srp	\N	1
25	Jojie Maramara	Butuan City	\N	Credit	srp	\N	1
26	JPT Rice and Feeds Retailing	Butuan City	\N	\N	srp	\N	1
27	M&N Agrivet	Nasipit, Ag Nor	\N	Credit	srp	\N	1
28	Madat Agrivet	Buenavista, Ag Nor	\N	Credit	srp	\N	1
29	Mazaua Pet Shop	Butuan City	\N	Credit	srp	\N	1
30	NP Intino	Ampayon, Butuan City	\N	Credit	srp	\N	1
31	Obud Store	Buenavista, Ag Nor	\N	Credit	srp	\N	1
32	PLK Pet Shop	Villakananga, Butuan City	\N	\N	srp	\N	1
33	PLK Petshop	Villakananga, Butuan City	\N	Credit	srp	\N	1
34	Po Tropical	Butuan City	\N	\N	srp	\N	1
35	The Hobby Company Pet Shop	Buenavista, Ag Nor	\N	Credit	srp	\N	1
37	Urban Paws	Butuan City	\N	Credit	srp	\N	1
38	WRM	Surigao City	\N	Credit	srp	\N	1
39	WRM Agrivet & Pet Shop	Surigao City	\N	\N	srp	\N	1
16	Greenfield Agrivet Supply	Cubi-cubi District West, National Highway, Nasipit (Marites Selim)	09338588310	15 days	outright	\N	1
36	Tomba Store	Nasipit, Ag Nor	\N	Credit	srp	\N	1
\.


--
-- Data for Name: deliveries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deliveries (id, sale_id, dr_no, date, delivered_by, vehicle, status, received_by, delivered_date, notes, version, signature) FROM stdin;
49	20	000159	2026-07-30			Delivered	\N	2026-07-30		1	\N
48	19	000158	2026-07-30			Delivered	\N	2026-07-30		1	\N
47	18	000157	2026-07-30			Delivered	\N	2026-07-30		1	\N
46	17	000154	2026-07-30			Delivered	\N	2026-07-30		1	\N
45	16	000152	2026-07-30			Delivered	\N	2026-07-30		1	\N
71	44	000199	2026-07-30			Delivered	\N	2026-07-30		1	\N
70	43	000198	2026-07-30			Delivered	\N	2026-07-30		1	\N
69	42	000197	2026-07-30			Delivered	\N	2026-07-30		1	\N
68	41	000195	2026-07-30			Delivered	\N	2026-07-30		1	\N
67	40	000194	2026-07-30			Delivered	\N	2026-07-30		1	\N
66	39	000192	2026-07-30			Delivered	\N	2026-07-30		1	\N
65	38	000191	2026-07-30			Delivered	\N	2026-07-30		1	\N
64	37	000190	2026-07-30			Delivered	\N	2026-07-30		1	\N
63	36	000188	2026-07-30			Delivered	\N	2026-07-30		1	\N
62	35	000187	2026-07-30			Delivered	\N	2026-07-30		1	\N
61	34	000185	2026-07-30			Delivered	\N	2026-07-30		1	\N
60	33	000184	2026-07-30			Delivered	\N	2026-07-30		1	\N
59	31	000181	2026-07-30			Delivered	\N	2026-07-30		1	\N
58	30	000180	2026-07-30			Delivered	\N	2026-07-30		1	\N
57	28	000175	2026-07-30			Delivered	\N	2026-07-30		1	\N
56	27	000171	2026-07-30			Delivered	\N	2026-07-30		1	\N
55	26	000169	2026-07-30			Delivered	\N	2026-07-30		1	\N
54	23	000167	2026-07-30			Delivered	\N	2026-07-30		1	\N
53	25	000166	2026-07-30			Delivered	\N	2026-07-30		1	\N
52	24	000165	2026-07-30			Delivered	\N	2026-07-30		1	\N
51	22	000162	2026-07-30			Delivered	\N	2026-07-30		1	\N
50	21	000161	2026-07-30			Delivered	\N	2026-07-30		1	\N
44	15	000151	2026-07-30			Delivered	\N	2026-07-30		1	\N
43	80	000240	2026-07-30			Delivered	\N	2026-07-30		1	\N
42	72	000239	2026-07-30			Delivered	\N	2026-07-30		1	\N
41	61	000238	2026-07-30			Delivered	\N	2026-07-30		1	\N
40	64	000237	2026-07-30			Delivered	\N	2026-07-30		1	\N
39	57	000236	2026-07-30			Delivered	\N	2026-07-30		1	\N
38	78	000235	2026-07-30			Delivered	\N	2026-07-30		1	\N
37	77	000232	2026-07-30			Delivered	\N	2026-07-30		1	\N
36	76	000231	2026-07-30			Delivered	\N	2026-07-30		1	\N
35	75	000230	2026-07-30			Delivered	\N	2026-07-30		1	\N
34	73	000229	2026-07-30			Delivered	\N	2026-07-30		1	\N
33	69	000228	2026-07-30			Delivered	\N	2026-07-30		1	\N
32	68	000227	2026-07-30			Delivered	\N	2026-07-30		1	\N
31	67	000224	2026-07-30			Delivered	\N	2026-07-30		1	\N
30	66	000223	2026-07-30			Delivered	\N	2026-07-30		1	\N
29	63	000220	2026-07-30			Delivered	\N	2026-07-30		1	\N
28	62	000219	2026-07-30			Delivered	\N	2026-07-30		1	\N
27	60	000218	2026-07-30			Delivered	\N	2026-07-30		1	\N
26	59	000216	2026-07-30			Delivered	\N	2026-07-30		1	\N
25	58	000215	2026-07-30			Delivered	\N	2026-07-30		1	\N
24	56	000214	2026-07-30			Delivered	\N	2026-07-30		1	\N
23	55	000213	2026-07-30			Delivered	\N	2026-07-30		1	\N
22	54	000212	2026-07-30			Delivered	\N	2026-07-30		1	\N
21	45	000210	2026-07-30			Delivered	\N	2026-07-30		1	\N
20	53	000209	2026-07-30			Delivered	\N	2026-07-30		1	\N
19	52	000206	2026-07-30			Delivered	\N	2026-07-30		1	\N
18	51	000205	2026-07-30			Delivered	\N	2026-07-30		1	\N
17	50	000204	2026-07-30			Delivered	\N	2026-07-30		1	\N
16	48	000203	2026-07-30			Delivered	\N	2026-07-30		1	\N
15	47	000202	2026-07-30			Delivered	\N	2026-07-30		1	\N
14	46	000201	2026-07-30			Delivered	\N	2026-07-30		1	\N
13	82	000241	2026-07-30			Delivered	\N	2026-07-30		1	\N
12	83	000242	2026-07-30			Delivered	\N	2026-07-30		1	\N
11	84	000243	2026-07-30			Delivered	\N	2026-07-30		1	\N
10	85	000244	2026-07-30			Delivered	\N	2026-07-30		1	\N
9	86	000247	2026-07-30			Delivered	\N	2026-07-30		1	\N
8	87	000248	2026-07-30			Delivered	\N	2026-07-30		1	\N
7	88	000249	2026-07-30			Delivered	\N	2026-07-30		1	\N
6	90	000252	2026-07-30			Delivered	\N	2026-07-30		1	\N
5	89	000251	2026-07-30			Delivered	\N	2026-07-30		1	\N
79	95	000178	2026-07-30			Delivered	\N	2026-07-30		1	\N
78	91	000156	2026-07-30			Delivered	\N	2026-07-30		1	\N
77	93	000163	2026-07-30			Delivered	\N	2026-07-30		1	\N
76	92	000160	2026-07-30			Delivered	\N	2026-07-30		1	\N
75	94	000168	2026-07-30			Delivered	\N	2026-07-30		1	\N
80	96	000253	2026-07-31			Pending	\N	\N		1	\N
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenses (id, date, ref_id, category, amount, tax, shipping, fees, account_id, description, remarks, version, receipt) FROM stdin;
\.


--
-- Data for Name: financial_allocations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.financial_allocations (id, date, user_name, allocation, old_rate, new_rate, remarks, version) FROM stdin;
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.items (id, name, sku, category, type, initial_stock, minimum_stock, sales_price, cost, preferred_vendor_id, units_in_purchase, promotion, notes, deal, outright_rate, cod_rate, price_breakdown, packaging, uom, srp_kilo, dealer_srp, dealers_acquisition, version) FROM stdin;
65	Supremo Infinity Super Conditioner (25KG)	\N	Gamefowl	Feed	0.000	0.000	1120.0000	942.8800	\N	0.000	\N	\N	\N	0.0000	0.0000	{"fth": 35, "vat": "none", "ex_plant": 1120, "pbd_rate": 0.05, "discounts": {"bdf": 5, "pickup": 15, "manpower": 7.5, "distributor": 100}, "dealer_build": {"fth": 35.0, "ktech": 5.0, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 10.0, "manpower_fund": 10.0, "dist_to_dealer": 10.0, "dealer_discount": 50.0, "net_dealer_price": 1120.0187, "distributor_income": 47.1438}}	\N	bag	46.0000	\N	1120.0187	1
66	UNO+ Booster (25x1kg)	\N	Supreme Hogs	Feed	0.000	0.000	2340.0000	2156.5000	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 2340, "pbd_rate": 0.05, "discounts": {"bdf": 5, "pickup": 15, "manpower": 10, "distributor": 40}, "dealer_build": {"fth": 35.0, "ktech": 5.0, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 10.0, "manpower_fund": 10.0, "dist_to_dealer": 10.0, "dealer_discount": 50.0, "net_dealer_price": 2336.5, "distributor_income": 50.0}, "distributor_income": 50}	\N	bag	95.0000	\N	2336.5000	1
67	UNO+ Supreme Pre Starter Crumble (25KG)	\N	Supreme Hogs	Feed	0.000	0.000	1585.0000	1415.5000	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 1630, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 20, "distributor": 80}, "dealer_build": {"fth": 35.0, "ktech": 5.0, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 10.0, "manpower_fund": 10.0, "dist_to_dealer": 10.0, "dealer_discount": 40.0, "net_dealer_price": 1585.5, "distributor_income": 50.0}, "distributor_income": 50}	\N	bag	65.0000	\N	1585.5000	1
68	UNO+ Supreme Starter Pellet (50KG)	\N	Supreme Hogs	Feed	0.000	0.000	2195.0000	1876.2500	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 2115, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 20, "distributor": 80}, "dealer_build": {"fth": 70.0, "ktech": 10.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 20.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 80.0, "net_dealer_price": 2196.25, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	46.0000	\N	2196.2500	1
69	UNO+ Supreme Grower (50KG)	\N	Supreme Hogs	Feed	0.000	0.000	2150.0000	1828.7500	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 2065, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 20, "distributor": 80}, "dealer_build": {"fth": 70.0, "ktech": 10.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 20.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 80.0, "net_dealer_price": 2148.75, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	45.0000	\N	2148.7500	1
70	UNO+ Supreme Finisher (50KG)	\N	Supreme Hogs	Feed	0.000	0.000	2050.0000	1729.0000	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 1960, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 20, "distributor": 80}, "dealer_build": {"fth": 70.0, "ktech": 10.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 20.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 80.0, "net_dealer_price": 2049.0, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	43.0000	\N	2049.0000	1
71	UNO+ Supreme Breeder (50KG)	\N	Supreme Hogs	Feed	0.000	0.000	1940.0000	1619.7500	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 1845, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 20, "distributor": 80}, "dealer_build": {"fth": 70.0, "ktech": 10.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 20.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 80.0, "net_dealer_price": 1939.75, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	41.0000	\N	1939.7500	1
72	UNO+ Supreme Lactating (50KG)	\N	Supreme Hogs	Feed	0.000	0.000	2065.0000	1743.2500	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 1975, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 20, "distributor": 80}, "dealer_build": {"fth": 70.0, "ktech": 10.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 20.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 80.0, "net_dealer_price": 2063.25, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	43.0000	\N	2063.2500	1
74	UNO+ Starter (50KG)	\N	Premium Hogs	Feed	0.000	0.000	2092.0000	1776.5000	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 2010, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 20, "distributor": 80}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 2091.5, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	44.0000	\N	2091.5000	1
75	UNO+ Grower (50KG)	\N	Premium Hogs	Feed	0.000	0.000	1940.0000	1624.5000	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 1850, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 20, "distributor": 80}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 1939.5, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	41.0000	\N	1939.5000	1
109	Spectrum (96/box)	\N	Robichem	Medicine	0.000	0.000	19.8697	14.1926	\N	\N	\N	\N	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 22.0, "packaging": "5g.", "sheet_row": 9, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 1.8521}	5g.	box	\N	20.0000	16.0448	1
95	Topbreed TopTreats (Beef) 70gx12x4	\N	Pet Treats	Treat	0.000	0.000	2856.0000	0.0000	\N	0.000	\N	\N	\N	0.0000	0.0000	\N	\N	box	\N	\N	\N	1
73	UNO+ Pre Starter (25KG)	\N	Premium Hogs	Feed	0.000	0.000	1500.0000	1339.5000	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 1480, "pbd_rate": 0.05, "discounts": {"bdf": 5, "pickup": 15, "manpower": 10, "distributor": 40}, "dealer_build": {"fth": 35, "ktech": 5, "bus_devt": 5, "sales_fund": 5, "cash_discount": 5, "manpower_fund": 10, "dist_to_dealer": 10, "dealer_discount": 45, "net_dealer_price": 1499.5, "distributor_income": 40}, "distributor_income": 40}	\N	bag	61.0000	\N	1499.5000	1
94	Topbreed Creamy Treats (Tuna Flavor) .2g / 4 sticks/ ??	\N	Pet Treats	Treat	0.000	0.000	3648.0000	0.0000	\N	0.000	\N	\N	\N	0.0000	0.0000	\N	\N	piece	\N	\N	\N	1
93	Top Care CAT LITTER per PIECE (10L)	\N	Pet Supplies	Supply	0.000	0.000	190.0000	170.2400	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "included", "derived": "510.72 / 3"}	\N	piece	\N	\N	\N	1
101	Top Care CAT LITTER Lavander (10L)	\N	Pet Supplies	Supply	0.000	0.000	\N	170.2400	\N	\N	\N	Scent variant	\N	0.0000	0.0000	{"vat": "included", "derived": "510.72 / 3"}	\N	piece	\N	\N	\N	1
102	Top Care CAT LITTER Coffee (10L)	\N	Pet Supplies	Supply	0.000	0.000	\N	170.2400	\N	\N	\N	Scent variant	\N	0.0000	0.0000	{"vat": "included", "derived": "510.72 / 3"}	\N	piece	\N	\N	\N	1
142	SCM #00888 (Vit. A,D3,E) 1liters	\N	Robichem	Medicine	0.000	0.000	\N	2537.8080	\N	\N	\N	From URC catalog — not yet stocked	\N	0.0000	0.0000	{"vat": "add_12", "less": [0.1, 0.2, 0.05], "model": "scm", "labels": ["Volume discount 10%", "Pick-up 20%", "PBD 5%"], "invoice": 3486.0, "packaging": "1liters", "sheet_row": 45}	1liters	bottle	\N	\N	\N	1
143	SCM #0213 (Tiamulin 10%) 20kgs.	\N	Robichem	Medicine	0.000	0.000	\N	3749.2000	\N	\N	\N	From URC catalog — not yet stocked	\N	0.0000	0.0000	{"vat": "add_12", "less": [0.1, 0.2, 0.05], "model": "scm", "labels": ["Volume discount 10%", "Pick-up 20%", "PBD 5%"], "invoice": 5150.0, "packaging": "20kgs.", "sheet_row": 46}	20kgs.	jar	\N	\N	\N	1
144	SCM #00890 (Enro 10%) 1liters	\N	Robichem	Medicine	0.000	0.000	\N	1108.7440	\N	\N	\N	From URC catalog — not yet stocked	\N	0.0000	0.0000	{"vat": "add_12", "less": [0.1, 0.2, 0.05], "model": "scm", "labels": ["Volume discount 10%", "Pick-up 20%", "PBD 5%"], "invoice": 1523.0, "packaging": "1liters", "sheet_row": 47}	1liters	bottle	\N	\N	\N	1
145	SCM #00895 (Enro 20%) 1Liters	\N	Robichem	Medicine	0.000	0.000	\N	1490.9440	\N	\N	\N	From URC catalog — not yet stocked	\N	0.0000	0.0000	{"vat": "add_12", "less": [0.1, 0.2, 0.05], "model": "scm", "labels": ["Volume discount 10%", "Pick-up 20%", "PBD 5%"], "invoice": 2048.0, "packaging": "1Liters", "sheet_row": 48}	1Liters	bottle	\N	\N	\N	1
146	SCM 912 Penstrep P - LA 1Liters	\N	Robichem	Medicine	0.000	0.000	\N	176.1760	\N	\N	\N	From URC catalog — not yet stocked	\N	0.0000	0.0000	{"vat": "add_12", "less": [0.1, 0.2, 0.05], "model": "scm", "labels": ["Volume discount 10%", "Pick-up 20%", "PBD 5%"], "invoice": 242.0, "packaging": "1Liters", "sheet_row": 49}	1Liters	bottle	\N	\N	\N	1
147	SCM 926 (Vit. A,D3, E + C) 1Liters	\N	Robichem	Medicine	0.000	0.000	\N	1154.6080	\N	\N	\N	From URC catalog — not yet stocked	\N	0.0000	0.0000	{"vat": "add_12", "less": [0.1, 0.2, 0.05], "model": "scm", "labels": ["Volume discount 10%", "Pick-up 20%", "PBD 5%"], "invoice": 1586.0, "packaging": "1Liters", "sheet_row": 50}	1Liters	bottle	\N	\N	\N	1
148	SCM #00897 (Iron-D Ultima + B12) 100ml	\N	Robichem	Medicine	0.000	0.000	\N	481.9360	\N	\N	\N	From URC catalog — not yet stocked	\N	0.0000	0.0000	{"vat": "add_12", "less": [0.1, 0.2, 0.05], "model": "scm", "labels": ["Volume discount 10%", "Pick-up 20%", "PBD 5%"], "invoice": 662.0, "packaging": "100ml", "sheet_row": 51}	100ml	bottle	\N	\N	\N	1
149	SCM #00898 (Enro 15%) 100ml	\N	Robichem	Medicine	0.000	0.000	\N	314.0928	\N	\N	\N	From URC catalog — not yet stocked	\N	0.0000	0.0000	{"vat": "add_12", "less": [0.1, 0.2, 0.05], "model": "scm", "labels": ["Volume discount 10%", "Pick-up 20%", "PBD 5%"], "invoice": 410.0, "packaging": "100ml", "sheet_row": 52}	100ml	bottle	\N	\N	\N	1
150	SCM 931 Pen. Potassium 10dose	\N	Robichem	Medicine	0.000	0.000	\N	53.8720	\N	\N	\N	From URC catalog — not yet stocked	\N	0.0000	0.0000	{"vat": "add_12", "less": [0.1, 0.2, 0.05], "model": "scm", "labels": ["Volume discount 10%", "Pick-up 20%", "PBD 5%"], "invoice": 74.0, "packaging": "10dose", "sheet_row": 53}	10dose	bottle	\N	\N	\N	1
151	SCM 00915 B- Complex 2kgs.	\N	Robichem	Medicine	0.000	0.000	\N	771.6800	\N	\N	\N	From URC catalog — not yet stocked	\N	0.0000	0.0000	{"vat": "add_12", "less": [0.1, 0.2, 0.05], "model": "scm", "labels": ["Volume discount 10%", "Pick-up 20%", "PBD 5%"], "invoice": 1060.0, "packaging": "2kgs.", "sheet_row": 54}	2kgs.	jar	\N	\N	\N	1
152	SCM 911 Robigenxyn P 50dose	\N	Robichem	Medicine	0.000	0.000	\N	191.4640	\N	\N	\N	From URC catalog — not yet stocked	\N	0.0000	0.0000	{"vat": "add_12", "less": [0.1, 0.2, 0.05], "model": "scm", "labels": ["Volume discount 10%", "Pick-up 20%", "PBD 5%"], "invoice": 263.0, "packaging": "50dose", "sheet_row": 55}	50dose	bottle	\N	\N	\N	1
153	SCM #00910 LA 100ml	\N	Robichem	Medicine	0.000	0.000	\N	283.1920	\N	\N	\N	From URC catalog — not yet stocked	\N	0.0000	0.0000	{"vat": "add_12", "less": [0.1, 0.2, 0.05], "model": "scm", "labels": ["Volume discount 10%", "Pick-up 20%", "PBD 5%"], "invoice": 389.0, "packaging": "100ml", "sheet_row": 56}	100ml	bottle	\N	\N	\N	1
154	SCM 0213 Tiamulin 10% 20kgs.	\N	Robichem	Medicine	0.000	0.000	\N	8852.4800	\N	\N	\N	From URC catalog — not yet stocked	\N	0.0000	0.0000	{"vat": "add_12", "less": [0.1, 0.2, 0.05], "model": "scm", "labels": ["Volume discount 10%", "Pick-up 20%", "PBD 5%"], "invoice": 12160.0, "packaging": "20kgs.", "sheet_row": 57}	20kgs.	jar	\N	\N	\N	1
76	UNO+ Finisher (50KG)	\N	Premium Hogs	Feed	0.000	0.000	1915.0000	1596.0000	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 1820, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 20, "distributor": 80}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 1911.0, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	40.0000	\N	1911.0000	1
77	UNO+ Breeder (50KG)	\N	Premium Hogs	Feed	0.000	0.000	1900.0000	1581.7500	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 1805, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 20, "distributor": 80}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 1896.75, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	40.0000	\N	1896.7500	1
78	UNO+ Lactating (50KG)	\N	Premium Hogs	Feed	0.000	0.000	2020.0000	1705.2500	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 1935, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 20, "distributor": 80}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 2020.25, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	42.0000	\N	2020.2500	1
79	Stargain Starter (50KG)	\N	Stargain Hogs	Feed	0.000	0.000	1995.0000	1676.7500	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 1905, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 20, "distributor": 80}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 1991.75, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	42.0000	\N	1991.7500	1
80	Stargain Grower (50KG)	\N	Stargain Hogs	Feed	0.000	0.000	1830.0000	1515.2500	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 1735, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 20, "distributor": 80}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 1830.25, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	39.0000	\N	1830.2500	1
81	Stargain Finisher (50KG)	\N	Stargain Hogs	Feed	0.000	0.000	1790.0000	1472.5000	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 1690, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 20, "distributor": 80}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 1787.5, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	38.0000	\N	1787.5000	1
82	Stargain Breeder (50KG)	\N	Stargain Hogs	Feed	0.000	0.000	1840.0000	1524.7500	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 1745, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 20, "distributor": 80}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 1839.75, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	39.0000	\N	1839.7500	1
121	Spectrum 2kgs.	\N	Robichem	Medicine	0.000	0.000	1812.6582	1294.7558	\N	\N	\N	From URC catalog — not yet stocked	5 + 1	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 2007.0, "packaging": "2kgs.", "sheet_row": 7, "srp_markup": 1.4, "dealer_deal": "6 +1", "margin_rate": 0.1305, "distributor_profit": 168.9656}	2kgs.	jar	\N	1750.0000	1463.7215	1
49	Supremo Infinity 1 - Chick Booster Crumble (50KG)	\N	Gamefowl	Feed	0.000	0.000	2300.0000	1980.7500	\N	0.000	B1T1	\N	\N	0.0000	0.0000	{"fth": 70, "vat": "none", "ex_plant": 2340, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 15, "distributor": 200}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 2295.75, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	48.0000	\N	2295.7500	1
50	Supremo Infinity 2 - Chick Grower Crumble (50KG)	\N	Gamefowl	Feed	0.000	0.000	2060.0000	1743.2500	\N	0.000	20% OFF	\N	\N	0.0000	0.0000	{"fth": 70, "vat": "none", "ex_plant": 2090, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 15, "distributor": 200}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 2058.25, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	43.0000	\N	2058.2500	1
51	Supremo Infinity 2.1 - Developer - 3 Grains (50KG)	\N	Gamefowl	Feed	0.000	0.000	2040.0000	1724.2500	\N	0.000	\N	\N	\N	0.0000	0.0000	{"fth": 70, "vat": "none", "ex_plant": 2070, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 15, "distributor": 200}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 2039.25, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	43.0000	\N	2039.2500	1
52	Supremo Infinity 3 - Maintenance Pellets - 15% CP (50KG)	\N	Gamefowl	Feed	0.000	0.000	1785.0000	1467.7500	\N	0.000	\N	\N	\N	0.0000	0.0000	{"fth": 70, "vat": "none", "ex_plant": 1800, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 15, "distributor": 200}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 1782.75, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	38.0000	\N	1782.7500	1
53	Supremo Infinity 3 - Maintenance Pellets - 15% CP w/ Grain (50KG)	\N	Gamefowl	Feed	0.000	0.000	2200.0000	1885.7500	\N	0.000	\N	\N	\N	0.0000	0.0000	{"fth": 70, "vat": "none", "ex_plant": 2240, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 15, "distributor": 200}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 2200.75, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	46.0000	\N	2200.7500	1
54	Supremo Infinity 4 - Breeder Pellets (50KG)	\N	Gamefowl	Feed	0.000	0.000	2125.0000	1809.7500	\N	0.000	\N	\N	\N	0.0000	0.0000	{"fth": 70, "vat": "none", "ex_plant": 2160, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 15, "distributor": 200}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 2124.75, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	44.5000	\N	2124.7500	1
55	Supremo Infinity Ready Mix - Grains + Pellets (RED) (50kg)	\N	Gamefowl	Feed	0.000	0.000	1985.0000	1667.2500	\N	0.000	\N	\N	\N	0.0000	0.0000	{"fth": 70, "vat": "none", "ex_plant": 2010, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 15, "distributor": 200}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 1982.25, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	42.0000	\N	1982.2500	1
56	Supremo Infinity Ready Mix - Grains + Pellets (RED) (25x1kg)	\N	Gamefowl	Feed	0.000	0.000	1025.0000	852.6300	\N	0.000	\N	\N	\N	0.0000	0.0000	{"fth": 35, "vat": "none", "ex_plant": 1025, "pbd_rate": 0.05, "discounts": {"bdf": 5, "pickup": 15, "manpower": 7.5, "distributor": 100}, "dealer_build": {"fth": 35.0, "ktech": 5.0, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 10.0, "manpower_fund": 10.0, "dist_to_dealer": 10.0, "dealer_discount": 50.0, "net_dealer_price": 1025.2562, "distributor_income": 42.6313}}	\N	bag	44.0000	\N	1025.2562	1
57	Supremo Infinity 1 Booster (25x1kg)	\N	Gamefowl	Feed	0.000	0.000	1245.0000	1058.7800	\N	0.000	\N	\N	\N	0.0000	0.0000	{"fth": 35, "vat": "none", "ex_plant": 1242, "pbd_rate": 0.05, "discounts": {"bdf": 5, "pickup": 15, "manpower": 7.5, "distributor": 100}, "dealer_build": {"fth": 35.0, "ktech": 5.0, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 10.0, "manpower_fund": 10.0, "dist_to_dealer": 10.0, "dealer_discount": 50.0, "net_dealer_price": 1241.7138, "distributor_income": 52.9388}}	\N	bag	51.0000	\N	1241.7138	1
58	Supremo Infinity 2 Grower (25x1kg)	\N	Gamefowl	Feed	0.000	0.000	1135.0000	957.1300	\N	0.000	\N	\N	\N	0.0000	0.0000	{"fth": 35, "vat": "none", "ex_plant": 1135, "pbd_rate": 0.05, "discounts": {"bdf": 5, "pickup": 15, "manpower": 7.5, "distributor": 100}, "dealer_build": {"fth": 35.0, "ktech": 5.0, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 10.0, "manpower_fund": 10.0, "dist_to_dealer": 10.0, "dealer_discount": 50.0, "net_dealer_price": 1134.9813, "distributor_income": 47.8563}}	\N	bag	47.0000	\N	1134.9813	1
59	Supremo Infinity 2.1 Developer + (25x1kg)	\N	Gamefowl	Feed	0.000	0.000	1105.0000	928.6300	\N	0.000	\N	\N	\N	0.0000	0.0000	{"fth": 35, "vat": "none", "ex_plant": 1105, "pbd_rate": 0.05, "discounts": {"bdf": 5, "pickup": 15, "manpower": 7.5, "distributor": 100}, "dealer_build": {"fth": 35.0, "ktech": 5.0, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 10.0, "manpower_fund": 10.0, "dist_to_dealer": 10.0, "dealer_discount": 50.0, "net_dealer_price": 1105.0563, "distributor_income": 46.4313}}	\N	bag	46.0000	\N	1105.0563	1
120	Gallistat K Powder 2.27kgs.	\N	Robichem	Medicine	0.000	0.000	2509.0007	1792.1434	\N	\N	\N	From URC catalog — not yet stocked	5 + 1	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 2778.0, "packaging": "2.27kgs.", "sheet_row": 4, "srp_markup": 1.4, "dealer_deal": "6 +1", "margin_rate": 0.1305, "distributor_profit": 233.8747}	2.27kgs.	jar	\N	2430.0000	2026.0181	1
107	Coccibuster	\N	Robichem	Medicine	0.000	0.000	18.9665	13.5475	\N	\N	\N	\N	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 21.0, "packaging": "5g.", "sheet_row": 5, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 1.768}	5g.	sachet	\N	20.0000	15.3155	1
155	Robophos 1 Liter	\N	Robichem	Medicine	0.000	0.000	730.7664	521.9760	\N	\N	\N	From URC catalog — not yet stocked	\N	0.1500	0.0500	{"vat": "add_12", "less": [0.1, 0.2, 0.05], "model": "scm", "labels": ["Volume discount 10%", "Pick-up 20%", "PBD 5%"], "invoice": 717.0, "packaging": "1 Liter", "sheet_row": 58, "srp_markup": 1.4, "margin_rate": 0.1305, "distributor_profit": 68.1179}	1 Liter	bottle	\N	720.0000	590.0939	1
158	Shampooch 1Liter x 6Liters	\N	Robichem	Medicine	0.000	0.000	3061.1280	2186.5200	\N	\N	\N	From URC catalog — not yet stocked	\N	0.1500	0.0500	{"pd": 260.0, "vat": "add_12", "model": "dealer", "volume": 260.0, "invoice": 2575.0, "packaging": "1Liter x 6Liters", "pbd_pesos": 102.75, "sheet_row": 65, "srp_markup": 1.4, "margin_rate": 0.1305, "distributor_profit": 285.3409}	1Liter x 6Liters	bottle	\N	2990.0000	2471.8609	1
60	Supremo Infinity 4 Breeder (25x1kg)	\N	Gamefowl	Feed	0.000	0.000	1160.0000	980.8800	\N	0.000	\N	\N	\N	0.0000	0.0000	{"fth": 35, "vat": "none", "ex_plant": 1160, "pbd_rate": 0.05, "discounts": {"bdf": 5, "pickup": 15, "manpower": 7.5, "distributor": 100}, "dealer_build": {"fth": 35.0, "ktech": 5.0, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 10.0, "manpower_fund": 10.0, "dist_to_dealer": 10.0, "dealer_discount": 50.0, "net_dealer_price": 1159.9188, "distributor_income": 49.0438}}	\N	bag	48.0000	\N	1159.9188	1
61	Supremo Infinity Ready Mix red (25x1kg)	\N	Gamefowl	Feed	0.000	0.000	1075.0000	900.1300	\N	0.000	\N	\N	\N	0.0000	0.0000	{"fth": 35, "vat": "none", "ex_plant": 1075, "pbd_rate": 0.05, "discounts": {"bdf": 5, "pickup": 15, "manpower": 7.5, "distributor": 100}, "dealer_build": {"fth": 35.0, "ktech": 5.0, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 10.0, "manpower_fund": 10.0, "dist_to_dealer": 10.0, "dealer_discount": 50.0, "net_dealer_price": 1075.1312, "distributor_income": 45.0063}}	\N	bag	44.0000	\N	1075.1312	1
62	Supremo Infinity 23 Conditioning (25x1kg)	\N	Gamefowl	Feed	0.000	0.000	1380.0000	1189.8800	\N	0.000	\N	\N	\N	0.0000	0.0000	{"fth": 35, "vat": "none", "ex_plant": 1380, "pbd_rate": 0.05, "discounts": {"bdf": 5, "pickup": 15, "manpower": 7.5, "distributor": 100}, "dealer_build": {"fth": 35.0, "ktech": 5.0, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 10.0, "manpower_fund": 10.0, "dist_to_dealer": 10.0, "dealer_discount": 50.0, "net_dealer_price": 1379.3688, "distributor_income": 59.4938}}	\N	bag	57.0000	\N	1379.3688	1
63	Supremo Infinity 32 Pellets - 32% CP (25x1kg)	\N	Gamefowl	Feed	0.000	0.000	1405.0000	1213.6300	\N	0.000	\N	\N	\N	0.0000	0.0000	{"fth": 35, "vat": "none", "note": "Fortifier 32 in matrix", "ex_plant": 1405, "pbd_rate": 0.05, "discounts": {"bdf": 5, "pickup": 15, "manpower": 7.5, "distributor": 100}, "dealer_build": {"fth": 35.0, "ktech": 5.0, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 10.0, "manpower_fund": 10.0, "dist_to_dealer": 10.0, "dealer_discount": 50.0, "net_dealer_price": 1404.3063, "distributor_income": 60.6813}}	\N	bag	58.0000	\N	1404.3063	1
64	Supremo Infinity Power Concentrate (25KG)	\N	Gamefowl	Feed	0.000	0.000	1080.0000	904.8800	\N	0.000	\N	\N	\N	0.0000	0.0000	{"fth": 35, "vat": "none", "ex_plant": 1080, "pbd_rate": 0.05, "discounts": {"bdf": 5, "pickup": 15, "manpower": 7.5, "distributor": 100}, "dealer_build": {"fth": 35.0, "ktech": 5.0, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 10.0, "manpower_fund": 10.0, "dist_to_dealer": 10.0, "dealer_discount": 50.0, "net_dealer_price": 1080.1188, "distributor_income": 45.2438}}	\N	bag	44.0000	\N	1080.1188	1
83	Stargain Lactating (50KG)	\N	Stargain Hogs	Feed	0.000	0.000	1970.0000	1653.0000	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "none", "ex_plant": 1880, "pbd_rate": 0.05, "discounts": {"bdf": 10, "pickup": 30, "manpower": 20, "distributor": 80}, "dealer_build": {"fth": 70.0, "ktech": 5.0, "bus_devt": 10.0, "sales_fund": 10.0, "cash_discount": 10.0, "manpower_fund": 20.0, "dist_to_dealer": 20.0, "dealer_discount": 90.0, "net_dealer_price": 1968.0, "distributor_income": 80.0}, "distributor_income": 80}	\N	bag	41.0000	\N	1968.0000	1
84	Topbreed Dog Puppy (20KG)	\N	Pet Food	Feed	0.000	0.000	1880.0000	1615.1500	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "add_12", "ex_plant": 1715, "pbd_rate": 0.05, "discounts": {"od": 80, "bdf": 4, "pickup": 25, "special": 80, "manpower": 8}, "dealer_build": {"fth": 30.0, "ktech": null, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 20.0, "manpower_fund": 5.0, "tactical_fund": 9.0904, "dist_to_dealer": 10.0, "dealer_discount": 100.0, "net_dealer_price": 1870.9096, "distributor_income": 80.7576}}	\N	bag	100.0000	\N	1870.9096	1
85	Topbreed Dog Adult (20KG)	\N	Pet Food	Feed	0.000	0.000	1580.0000	1338.5100	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "add_12", "ex_plant": 1455, "pbd_rate": 0.05, "discounts": {"od": 80, "bdf": 4, "pickup": 25, "special": 80, "manpower": 8}, "dealer_build": {"fth": 30.0, "ktech": null, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 20.0, "manpower_fund": 5.0, "tactical_fund": -0.4376, "dist_to_dealer": 10.0, "dealer_discount": 100.0, "net_dealer_price": 1580.4376, "distributor_income": 66.9256}}	\N	bag	87.0000	\N	1580.4376	1
86	Topbreed Dog Adult Mini (20KG)	\N	Pet Food	Feed	0.000	0.000	1640.0000	1394.9000	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "add_12", "ex_plant": 1508, "pbd_rate": 0.05, "discounts": {"od": 80, "bdf": 4, "pickup": 25, "special": 80, "manpower": 8}, "dealer_build": {"fth": 30.0, "ktech": null, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 20.0, "manpower_fund": 5.0, "tactical_fund": 0.3508, "dist_to_dealer": 10.0, "dealer_discount": 100.0, "net_dealer_price": 1639.6492, "distributor_income": 69.7452}}	\N	bag	90.0000	\N	1639.6492	1
87	Topbreed Cat Adult (20KG)	\N	Pet Food	Feed	0.000	0.000	2270.0000	1992.3500	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "add_12", "ex_plant": 2069.51, "pbd_rate": 0.05, "discounts": {"od": 80, "bdf": 4, "pickup": 25, "special": 80, "manpower": 8}, "dealer_build": {"fth": 30.0, "ktech": null, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 20.0, "manpower_fund": 5.0, "tactical_fund": 3.0318, "dist_to_dealer": 10.0, "dealer_discount": 100.0, "net_dealer_price": 2266.9682, "distributor_income": 99.6175}}	\N	bag	125.0000	\N	2266.9682	1
88	Topbreed Dog Adult (5KG)	\N	Pet Food	Feed	0.000	0.000	450.0000	348.1900	\N	0.000	\N	\N	20 + 1 bag	0.0000	0.0000	{"vat": "add_12", "ex_plant": 376.5, "pbd_rate": 0.05, "discounts": {"od": 20, "bdf": 1, "pickup": 6.25, "special": 20, "manpower": 2}, "dealer_build": {"fth": 10.0, "ktech": null, "bus_devt": 1.25, "sales_fund": 1.25, "cash_discount": 20.0, "manpower_fund": 1.25, "tactical_fund": 20.6463, "dist_to_dealer": 5.0, "dealer_discount": 25.0, "net_dealer_price": 429.3537, "distributor_income": 17.4097}}	\N	bag	95.0000	\N	429.3537	1
89	Topbreed Dog Adult Mini (5KG)	\N	Pet Food	Feed	0.000	0.000	470.0000	358.8300	\N	0.000	\N	\N	20 + 1 bag	0.0000	0.0000	{"vat": "add_12", "ex_plant": 386.5, "pbd_rate": 0.05, "discounts": {"od": 20, "bdf": 1, "pickup": 6.25, "special": 20, "manpower": 2}, "dealer_build": {"fth": 10.0, "ktech": null, "bus_devt": 1.25, "sales_fund": 1.25, "cash_discount": 20.0, "manpower_fund": 1.25, "tactical_fund": 29.4743, "dist_to_dealer": 5.0, "dealer_discount": 25.0, "net_dealer_price": 440.5257, "distributor_income": 17.9417}}	\N	bag	98.0000	\N	440.5257	1
90	Topbreed Cat Adult (5KG)	\N	Pet Food	Feed	0.000	0.000	630.0000	512.4400	\N	0.000	\N	\N	20 + 1 bag	0.0000	0.0000	{"vat": "add_12", "ex_plant": 530.87, "pbd_rate": 0.05, "discounts": {"od": 20, "bdf": 1, "pickup": 6.25, "special": 20, "manpower": 2}, "dealer_build": {"fth": 10.0, "ktech": null, "bus_devt": 1.25, "sales_fund": 1.25, "cash_discount": 20.0, "manpower_fund": 1.25, "tactical_fund": 28.8063, "dist_to_dealer": 5.0, "dealer_discount": 25.0, "net_dealer_price": 601.1937, "distributor_income": 25.0}}	\N	bag	130.0000	\N	601.1937	1
91	Topbreed Dog Puppy 2kgx10	\N	Pet Food	Feed	0.000	0.000	2080.0000	1806.6700	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "add_12", "ex_plant": 1895, "pbd_rate": 0.05, "discounts": {"od": 80, "bdf": 4, "pickup": 25, "special": 80, "manpower": 8}, "dealer_build": {"fth": 30.0, "ktech": null, "bus_devt": 5.0, "sales_fund": 5.0, "cash_discount": 20.0, "manpower_fund": 5.0, "tactical_fund": 7.9944, "dist_to_dealer": 10.0, "dealer_discount": 100.0, "net_dealer_price": 2072.0056, "distributor_income": 90.3336}}	\N	box	220.0000	\N	2072.0056	1
96	Gravy Chunks (Roasted Chicken&Liver/Chicken&Liver Steak) 130gx12x4	\N	Pet Treats	Treat	0.000	0.000	1275.0000	0.0000	\N	0.000	\N	\N	\N	0.0000	0.0000	{"dealer_build": {"fth": 5.0, "ktech": null, "bus_devt": null, "sales_fund": null, "cash_discount": 5.0, "manpower_fund": null, "tactical_fund": null, "dist_to_dealer": 2.0, "dealer_discount": 144.0, "net_dealer_price": null, "distributor_income": null}}	\N	box	27.0000	\N	\N	1
92	Top Care CAT LITTER (10Lx3)	\N	Pet Supplies	Supply	0.000	0.000	640.0000	510.7200	\N	0.000	\N	\N	\N	0.0000	0.0000	{"vat": "included", "source": "price matrix Cat Litter row", "dealer_build": {"fth": 10.0, "ktech": null, "bus_devt": 2.5, "sales_fund": 2.5, "cash_discount": 5.0, "manpower_fund": 2.5, "tactical_fund": null, "dist_to_dealer": 5.0, "dealer_discount": 70.0, "net_dealer_price": 635.22, "distributor_income": 27.0}}	\N	bundle	750.0000	\N	635.2200	1
108	Levomax	\N	Robichem	Medicine	0.000	0.000	20.7729	14.8378	\N	\N	\N	\N	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 23.0, "packaging": "5g.", "sheet_row": 6, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 1.9363}	5g.	sachet	\N	20.0000	16.7741	1
122	Spectrum 110g.	\N	Robichem	Medicine	0.000	0.000	139.0879	99.3485	\N	\N	\N	From URC catalog — not yet stocked	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 154.0, "packaging": "110g.", "sheet_row": 8, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 12.965}	110g.	sachet	\N	135.0000	112.3135	1
123	Spectrum Plus 2kgs.	\N	Robichem	Medicine	0.000	0.000	5715.2471	4082.3194	\N	\N	\N	From URC catalog — not yet stocked	5 + 1	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 6328.0, "packaging": "2kgs.", "sheet_row": 10, "srp_markup": 1.4, "dealer_deal": "6 +1", "margin_rate": 0.1305, "distributor_profit": 532.7427}	2kgs.	jar	\N	5550.0000	4615.0620	1
124	Spectrum Plus 110g.	\N	Robichem	Medicine	0.000	0.000	328.7532	234.8237	\N	\N	\N	From URC catalog — not yet stocked	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 364.0, "packaging": "110g.", "sheet_row": 11, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 30.6445}	110g.	sachet	\N	320.0000	265.4682	1
110	Spectrum Plus (96/box)	\N	Robichem	Medicine	0.000	0.000	30.7077	21.9341	\N	\N	\N	\N	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 34.0, "packaging": "5g.", "sheet_row": 12, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 2.8624}	5g.	box	\N	30.0000	24.7965	1
125	Robistrep VK Powder 2.27kgs.	\N	Robichem	Medicine	0.000	0.000	2609.2524	1863.7517	\N	\N	\N	From URC catalog — not yet stocked	5 + 1	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 2889.0, "packaging": "2.27kgs.", "sheet_row": 13, "srp_markup": 1.4, "dealer_deal": "6 +1", "margin_rate": 0.1305, "distributor_profit": 243.2196}	2.27kgs.	jar	\N	2530.0000	2106.9713	1
126	Robistrep VK Powder 110g.	\N	Robichem	Medicine	0.000	0.000	189.6653	135.4752	\N	\N	\N	From URC catalog — not yet stocked	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 210.0, "packaging": "110g.", "sheet_row": 14, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 17.6795}	110g.	sachet	\N	185.0000	153.1547	1
127	Robistrep VK Powder 25g.	\N	Robichem	Medicine	0.000	0.000	59.6091	42.5779	\N	\N	\N	From URC catalog — not yet stocked	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 66.0, "packaging": "25g.", "sheet_row": 15, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 5.5564}	25g.	sachet	\N	60.0000	48.1343	1
111	Robistrep Vk 5Gm	\N	Robichem	Medicine	0.000	0.000	19.8697	14.1926	\N	\N	\N	\N	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 22.0, "packaging": "5g.", "sheet_row": 16, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 1.8521}	5g.	sachet	\N	20.0000	16.0448	1
128	Worm Buster 10g.	\N	Robichem	Medicine	0.000	0.000	30.7077	21.9341	\N	\N	\N	From URC catalog — not yet stocked	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 34.0, "packaging": "10g.", "sheet_row": 17, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 2.8624}	10g.	sachet	\N	30.0000	24.7965	1
112	Wormbuster Single Dose 5Gm	\N	Robichem	Medicine	0.000	0.000	10.8380	7.7414	\N	\N	\N	\N	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 12.0, "packaging": "5g.", "sheet_row": 18, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 1.0103}	5g.	sachet	\N	11.0000	8.7517	1
129	Robidoxin Powder 2.27kgs.	\N	Robichem	Medicine	0.000	0.000	2907.2978	2076.6413	\N	\N	\N	From URC catalog — not yet stocked	5 + 1	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 3219.0, "packaging": "2.27kgs.", "sheet_row": 19, "srp_markup": 1.4, "dealer_deal": "6 +1", "margin_rate": 0.1305, "distributor_profit": 271.0017}	2.27kgs.	jar	\N	2820.0000	2347.6430	1
130	Triple V Powder 2.27kgs.	\N	Robichem	Medicine	0.000	0.000	2887.4281	2062.4486	\N	\N	\N	From URC catalog — not yet stocked	5 + 1	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 3197.0, "packaging": "2.27kgs.", "sheet_row": 20, "srp_markup": 1.4, "dealer_deal": "6 +1", "margin_rate": 0.1305, "distributor_profit": 269.1495}	2.27kgs.	jar	\N	2800.0000	2331.5982	1
131	Vitafuracin Powder 2.27kgs.	\N	Robichem	Medicine	0.000	0.000	3037.3540	2169.5386	\N	\N	\N	From URC catalog — not yet stocked	5 + 1	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 3363.0, "packaging": "2.27kgs.", "sheet_row": 21, "srp_markup": 1.4, "dealer_deal": "6 +1", "margin_rate": 0.1305, "distributor_profit": 283.1248}	2.27kgs.	jar	\N	2950.0000	2452.6633	1
132	Vitafuracin Powder 5g.	\N	Robichem	Medicine	0.000	0.000	19.8697	14.1926	\N	\N	\N	From URC catalog — not yet stocked	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 22.0, "packaging": "5g.", "sheet_row": 22, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 1.8521}	5g.	sachet	\N	20.0000	16.0448	1
133	Robigenxyn P 50 ds w/ diluent	\N	Robichem	Medicine	0.000	0.000	378.4274	270.3053	\N	\N	\N	From URC catalog — not yet stocked	5 + 1	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 419.0, "packaging": "50 ds w/ diluent", "sheet_row": 23, "srp_markup": 1.4, "dealer_deal": "6 +1", "margin_rate": 0.1305, "distributor_profit": 35.2748}	50 ds w/ diluent	bottle	\N	370.0000	305.5801	1
134	Robigenxyn P 10dose	\N	Robichem	Medicine	0.000	0.000	134.5720	96.1229	\N	\N	\N	From URC catalog — not yet stocked	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 149.0, "packaging": "10dose", "sheet_row": 24, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 12.544}	10dose	bottle	\N	135.0000	108.6669	1
113	Robi L.A inj 100ml	\N	Robichem	Medicine	0.000	0.000	393.7812	281.2723	\N	\N	\N	\N	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 436.0, "packaging": "100 ml", "sheet_row": 25, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 36.706}	100 ml	bottle	\N	390.0000	317.9784	1
135	Robipenstrep P 50 ds w/ diluent	\N	Robichem	Medicine	0.000	0.000	269.1441	192.2458	\N	\N	\N	From URC catalog — not yet stocked	5 + 1	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 298.0, "packaging": "50 ds w/ diluent", "sheet_row": 26, "srp_markup": 1.4, "dealer_deal": "6 +1", "margin_rate": 0.1305, "distributor_profit": 25.0881}	50 ds w/ diluent	bottle	\N	265.0000	217.3338	1
114	Robipenstrep P 10dose/Diluent	\N	Robichem	Medicine	0.000	0.000	110.1865	78.7046	\N	\N	\N	\N	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 122.0, "packaging": "10 ds w/ diluent", "sheet_row": 27, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 10.271}	10 ds w/ diluent	bottle	\N	110.0000	88.9756	1
115	Robipenstrep P Single dose bt	\N	Robichem	Medicine	0.000	0.000	39.7394	28.3853	\N	\N	\N	\N	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 44.0, "packaging": "Single dose", "sheet_row": 28, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 3.7043}	Single dose	bottle	\N	40.0000	32.0896	1
116	Iron - D inj	\N	Robichem	Medicine	0.000	0.000	427.1985	305.1418	\N	\N	\N	\N	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 473.0, "packaging": "100 ml", "sheet_row": 29, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 39.821}	100 ml	bottle	\N	415.0000	344.9628	1
136	Iron D Supra Injectible 100 ml	\N	Robichem	Medicine	0.000	0.000	378.4274	270.3053	\N	\N	\N	From URC catalog — not yet stocked	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 419.0, "packaging": "100 ml", "sheet_row": 30, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 35.2748}	100 ml	bottle	\N	370.0000	305.5801	1
117	Robicomject inj 100ml	\N	Robichem	Medicine	0.000	0.000	358.5577	256.1126	\N	\N	\N	\N	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 397.0, "packaging": "100 ml", "sheet_row": 31, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 33.4227}	100 ml	bottle	\N	350.0000	289.5353	1
118	Tripulac Pig Doser 2x1 set	\N	Robichem	Medicine	0.000	0.000	347.7197	248.3712	\N	\N	\N	\N	10 + 2	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 385.0, "packaging": "2 x 100ml (disp.)", "sheet_row": 32, "srp_markup": 1.4, "dealer_deal": "10 + 1", "margin_rate": 0.1305, "distributor_profit": 32.4124}	2 x 100ml (disp.)	bottle	\N	350.0000	280.7836	1
137	Microbe Fighter 55 4 liters	\N	Robichem	Medicine	0.000	0.000	948.3264	677.3760	\N	\N	\N	From URC catalog — not yet stocked	\N	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 1050.0, "packaging": "4 liters", "sheet_row": 33, "srp_markup": 1.4, "dealer_deal": null, "margin_rate": 0.1305, "distributor_profit": 88.3976}	4 liters	bottle	\N	920.0000	765.7736	1
138	Microbe Fighter 55 100ml	\N	Robichem	Medicine	0.000	0.000	90.3168	64.5120	\N	\N	\N	From URC catalog — not yet stocked	\N	0.1500	0.0500	{"vat": "add_12", "less": [0.2, 0.1, 0.2], "model": "standard", "invoice": 100.0, "packaging": "100ml", "sheet_row": 34, "srp_markup": 1.4, "dealer_deal": null, "margin_rate": 0.1305, "distributor_profit": 8.4188}	100ml	bottle	\N	88.0000	72.9308	1
119	Wheatgerm 300Gm x 12/box	\N	Robichem	Medicine	0.000	0.000	994.2800	710.2000	\N	\N	\N	Unit: box	\N	0.1500	0.0500	{"vat": "none", "less": ["10%", "5%", "20%"], "model": "wheatgerm", "invoice": 1050.0, "packaging": "300g", "sheet_row": 37, "margin_rate": 0.1305, "pickup_pesos": 10.0, "distributor_profit": 92.6811}	300g	box	\N	990.0000	802.8811	1
139	Wheat Germ /Box 200g	\N	Robichem	Medicine	0.000	0.000	732.8552	523.4680	\N	\N	\N	From URC catalog — not yet stocked	\N	0.1500	0.0500	{"vat": "none", "less": ["10%", "5%", "20%"], "model": "wheatgerm", "invoice": 777.0, "packaging": "200g", "sheet_row": 38, "margin_rate": 0.1305, "pickup_pesos": 10.0, "distributor_profit": 68.3126}	200g	sachet	\N	715.0000	591.7806	1
140	Wheat Germ /Box 100g	\N	Robichem	Medicine	0.000	0.000	548.2176	391.5840	\N	\N	\N	From URC catalog — not yet stocked	\N	0.1500	0.0500	{"vat": "none", "less": ["10%", "5%", "20%"], "model": "wheatgerm", "invoice": 576.0, "packaging": "100g", "sheet_row": 39, "margin_rate": 0.1305, "pickup_pesos": 3.0, "distributor_profit": 51.1017}	100g	sachet	\N	550.0000	442.6857	1
141	Wheat Germ /Box 300g+200g	\N	Robichem	Medicine	0.000	0.000	960.7640	686.2600	\N	\N	\N	From URC catalog — not yet stocked	\N	0.1500	0.0500	{"vat": "none", "less": ["10%", "5%", "20%"], "model": "wheatgerm", "invoice": 1015.0, "packaging": "300g+200g", "sheet_row": 40, "margin_rate": 0.1305, "pickup_pesos": 10.0, "distributor_profit": 89.5569}	300g+200g	sachet	\N	950.0000	775.8169	1
104	Top B+ Vitamins 120ml	\N	Pet Supplies	Supply	0.000	0.000	2509.9760	1792.8400	\N	\N	\N	Unit: box	\N	0.1500	0.0500	{"pd": 340.0, "vat": "add_12", "model": "dealer", "volume": 450.0, "invoice": 2475.0, "packaging": "120ml x 18bottles", "pbd_pesos": 84.25, "sheet_row": 63, "srp_markup": 1.4, "margin_rate": 0.1305, "distributor_profit": 233.9656}	120ml x 18bottles	box	\N	2450.0000	2026.8056	1
103	Top B+ Vitamins 60ml	\N	Pet Supplies	Supply	0.000	0.000	3433.5280	2452.5200	\N	\N	\N	Unit: box	\N	0.1500	0.0500	{"pd": 430.0, "vat": "add_12", "model": "dealer", "volume": 570.0, "invoice": 3305.0, "packaging": "60ml x 36bottles", "pbd_pesos": 115.25, "sheet_row": 64, "srp_markup": 1.4, "margin_rate": 0.1305, "distributor_profit": 320.0539}	60ml x 36bottles	box	\N	3350.0000	2772.5739	1
106	Shampooch 300ml bt 12/box	\N	Pet Supplies	Supply	0.000	0.000	2383.3600	1702.4000	\N	\N	\N	Unit: box	\N	0.1500	0.0500	{"pd": 280.0, "vat": "add_12", "model": "dealer", "volume": 280.0, "invoice": 2160.0, "packaging": "300ml x 12bottles", "pbd_pesos": 80.0, "sheet_row": 66, "srp_markup": 1.4, "margin_rate": 0.1305, "distributor_profit": 222.1632}	300ml x 12bottles	box	\N	2350.0000	1924.5632	1
105	Shampooch Sachet	\N	Pet Supplies	Supply	0.000	0.000	4446.4560	3176.0400	\N	\N	\N	Unit: carton	\N	0.1500	0.0500	{"pd": 500.0, "vat": "add_12", "model": "dealer", "volume": 500.0, "invoice": 3985.0, "packaging": "15ml x 25sachets x 16box", "pbd_pesos": 149.25, "sheet_row": 67, "srp_markup": 1.4, "margin_rate": 0.1305, "distributor_profit": 414.4732}	15ml x 25sachets x 16box	carton	\N	4350.0000	3590.5132	1
\.


--
-- Data for Name: manual_inventory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.manual_inventory (id, date, batch_no, item_id, qty, notes, version) FROM stdin;
7	2026-07-29	STOCKTAKE-2026-07-29	49	35.000	Physical count 7/29/26	1
8	2026-07-29	STOCKTAKE-2026-07-29	50	45.000	Physical count 7/29/26	1
9	2026-07-29	STOCKTAKE-2026-07-29	51	48.000	Physical count 7/29/26	1
10	2026-07-29	STOCKTAKE-2026-07-29	52	30.000	Physical count 7/29/26	1
11	2026-07-29	STOCKTAKE-2026-07-29	54	4.000	Physical count 7/29/26	1
12	2026-07-29	STOCKTAKE-2026-07-29	55	38.000	Physical count 7/29/26	1
13	2026-07-29	STOCKTAKE-2026-07-29	56	12.000	Physical count 7/29/26	1
14	2026-07-29	STOCKTAKE-2026-07-29	57	1.000	Physical count 7/29/26	1
15	2026-07-29	STOCKTAKE-2026-07-29	58	18.000	Physical count 7/29/26	1
16	2026-07-29	STOCKTAKE-2026-07-29	59	4.000	Physical count 7/29/26	1
17	2026-07-29	STOCKTAKE-2026-07-29	60	1.000	Physical count 7/29/26	1
18	2026-07-29	STOCKTAKE-2026-07-29	61	3.000	Physical count 7/29/26	1
19	2026-07-29	STOCKTAKE-2026-07-29	62	35.000	Physical count 7/29/26	1
20	2026-07-29	STOCKTAKE-2026-07-29	63	13.000	Physical count 7/29/26	1
21	2026-07-29	STOCKTAKE-2026-07-29	64	2.000	Physical count 7/29/26	1
22	2026-07-29	STOCKTAKE-2026-07-29	65	3.000	Physical count 7/29/26	1
23	2026-07-29	STOCKTAKE-2026-07-29	66	2.000	Physical count 7/29/26	1
24	2026-07-29	STOCKTAKE-2026-07-29	72	8.000	Physical count 7/29/26	1
25	2026-07-29	STOCKTAKE-2026-07-29	74	75.000	Physical count 7/29/26	1
26	2026-07-29	STOCKTAKE-2026-07-29	75	35.000	Physical count 7/29/26	1
27	2026-07-29	STOCKTAKE-2026-07-29	76	15.000	Physical count 7/29/26	1
28	2026-07-29	STOCKTAKE-2026-07-29	77	60.000	Physical count 7/29/26	1
29	2026-07-29	STOCKTAKE-2026-07-29	78	53.000	Physical count 7/29/26	1
30	2026-07-29	STOCKTAKE-2026-07-29	79	12.000	Physical count 7/29/26	1
31	2026-07-29	STOCKTAKE-2026-07-29	80	30.000	Physical count 7/29/26	1
32	2026-07-29	STOCKTAKE-2026-07-29	81	9.000	Physical count 7/29/26	1
33	2026-07-29	STOCKTAKE-2026-07-29	82	50.000	Physical count 7/29/26	1
34	2026-07-29	STOCKTAKE-2026-07-29	83	8.000	Physical count 7/29/26	1
35	2026-07-29	STOCKTAKE-2026-07-29	84	5.000	Physical count 7/29/26	1
36	2026-07-29	STOCKTAKE-2026-07-29	86	60.000	Physical count 7/29/26	1
37	2026-07-29	STOCKTAKE-2026-07-29	101	40.000	Physical count 7/29/26	1
38	2026-07-29	STOCKTAKE-2026-07-29	102	55.000	Physical count 7/29/26	1
39	2026-07-29	STOCKTAKE-2026-07-29	103	19.000	Physical count 7/29/26	1
40	2026-07-29	STOCKTAKE-2026-07-29	104	20.000	Physical count 7/29/26	1
41	2026-07-29	STOCKTAKE-2026-07-29	105	7.000	Physical count 7/29/26	1
42	2026-07-29	STOCKTAKE-2026-07-29	106	8.000	Physical count 7/29/26	1
43	2026-07-29	STOCKTAKE-2026-07-29	107	500.000	Physical count 7/29/26	1
44	2026-07-29	STOCKTAKE-2026-07-29	108	500.000	Physical count 7/29/26	1
45	2026-07-29	STOCKTAKE-2026-07-29	109	1800.000	Physical count 7/29/26	1
46	2026-07-29	STOCKTAKE-2026-07-29	110	1800.000	Physical count 7/29/26	1
47	2026-07-29	STOCKTAKE-2026-07-29	111	1800.000	Physical count 7/29/26	1
48	2026-07-29	STOCKTAKE-2026-07-29	112	800.000	Physical count 7/29/26	1
49	2026-07-29	STOCKTAKE-2026-07-29	113	95.000	Physical count 7/29/26	1
50	2026-07-29	STOCKTAKE-2026-07-29	114	85.000	Physical count 7/29/26	1
51	2026-07-29	STOCKTAKE-2026-07-29	115	400.000	Physical count 7/29/26	1
52	2026-07-29	STOCKTAKE-2026-07-29	116	85.000	Physical count 7/29/26	1
53	2026-07-29	STOCKTAKE-2026-07-29	117	100.000	Physical count 7/29/26	1
54	2026-07-29	STOCKTAKE-2026-07-29	118	70.000	Physical count 7/29/26	1
55	2026-07-29	STOCKTAKE-2026-07-29	119	9.000	Physical count 7/29/26	1
56	2026-07-29	PRE-STOCKTAKE-OFFSET	116	8.000	Offset: masterlist sales predate the 7/29 physical count	1
57	2026-07-29	PRE-STOCKTAKE-OFFSET	117	4.000	Offset: masterlist sales predate the 7/29 physical count	1
58	2026-07-29	PRE-STOCKTAKE-OFFSET	114	1.000	Offset: masterlist sales predate the 7/29 physical count	1
59	2026-07-29	PRE-STOCKTAKE-OFFSET	106	22.000	Offset: masterlist sales predate the 7/29 physical count	1
60	2026-07-29	PRE-STOCKTAKE-OFFSET	105	7.000	Offset: masterlist sales predate the 7/29 physical count	1
61	2026-07-29	PRE-STOCKTAKE-OFFSET	82	16.000	Offset: masterlist sales predate the 7/29 physical count	1
62	2026-07-29	PRE-STOCKTAKE-OFFSET	80	8.000	Offset: masterlist sales predate the 7/29 physical count	1
63	2026-07-29	PRE-STOCKTAKE-OFFSET	79	16.000	Offset: masterlist sales predate the 7/29 physical count	1
64	2026-07-29	PRE-STOCKTAKE-OFFSET	49	22.000	Offset: masterlist sales predate the 7/29 physical count	1
65	2026-07-29	PRE-STOCKTAKE-OFFSET	57	11.000	Offset: masterlist sales predate the 7/29 physical count	1
66	2026-07-29	PRE-STOCKTAKE-OFFSET	50	38.000	Offset: masterlist sales predate the 7/29 physical count	1
67	2026-07-29	PRE-STOCKTAKE-OFFSET	58	22.000	Offset: masterlist sales predate the 7/29 physical count	1
68	2026-07-29	PRE-STOCKTAKE-OFFSET	51	18.000	Offset: masterlist sales predate the 7/29 physical count	1
69	2026-07-29	PRE-STOCKTAKE-OFFSET	59	5.000	Offset: masterlist sales predate the 7/29 physical count	1
70	2026-07-29	PRE-STOCKTAKE-OFFSET	62	6.000	Offset: masterlist sales predate the 7/29 physical count	1
71	2026-07-29	PRE-STOCKTAKE-OFFSET	52	79.000	Offset: masterlist sales predate the 7/29 physical count	1
72	2026-07-29	PRE-STOCKTAKE-OFFSET	63	10.000	Offset: masterlist sales predate the 7/29 physical count	1
73	2026-07-29	PRE-STOCKTAKE-OFFSET	54	6.000	Offset: masterlist sales predate the 7/29 physical count	1
74	2026-07-29	PRE-STOCKTAKE-OFFSET	60	3.000	Offset: masterlist sales predate the 7/29 physical count	1
75	2026-07-29	PRE-STOCKTAKE-OFFSET	64	3.000	Offset: masterlist sales predate the 7/29 physical count	1
76	2026-07-29	PRE-STOCKTAKE-OFFSET	56	25.000	Offset: masterlist sales predate the 7/29 physical count	1
77	2026-07-29	PRE-STOCKTAKE-OFFSET	55	28.000	Offset: masterlist sales predate the 7/29 physical count	1
78	2026-07-29	PRE-STOCKTAKE-OFFSET	61	13.000	Offset: masterlist sales predate the 7/29 physical count	1
79	2026-07-29	PRE-STOCKTAKE-OFFSET	65	4.000	Offset: masterlist sales predate the 7/29 physical count	1
80	2026-07-29	PRE-STOCKTAKE-OFFSET	103	29.000	Offset: masterlist sales predate the 7/29 physical count	1
81	2026-07-29	PRE-STOCKTAKE-OFFSET	102	261.000	Offset: masterlist sales predate the 7/29 physical count	1
82	2026-07-29	PRE-STOCKTAKE-OFFSET	101	288.000	Offset: masterlist sales predate the 7/29 physical count	1
83	2026-07-29	PRE-STOCKTAKE-OFFSET	87	60.000	Offset: masterlist sales predate the 7/29 physical count	1
84	2026-07-29	PRE-STOCKTAKE-OFFSET	90	21.000	Offset: masterlist sales predate the 7/29 physical count	1
85	2026-07-29	PRE-STOCKTAKE-OFFSET	85	98.000	Offset: masterlist sales predate the 7/29 physical count	1
86	2026-07-29	PRE-STOCKTAKE-OFFSET	88	5.000	Offset: masterlist sales predate the 7/29 physical count	1
87	2026-07-29	PRE-STOCKTAKE-OFFSET	86	12.000	Offset: masterlist sales predate the 7/29 physical count	1
88	2026-07-29	PRE-STOCKTAKE-OFFSET	89	45.000	Offset: masterlist sales predate the 7/29 physical count	1
89	2026-07-29	PRE-STOCKTAKE-OFFSET	84	37.000	Offset: masterlist sales predate the 7/29 physical count	1
90	2026-07-29	PRE-STOCKTAKE-OFFSET	118	20.000	Offset: masterlist sales predate the 7/29 physical count	1
91	2026-07-29	PRE-STOCKTAKE-OFFSET	77	7.000	Offset: masterlist sales predate the 7/29 physical count	1
92	2026-07-29	PRE-STOCKTAKE-OFFSET	76	6.000	Offset: masterlist sales predate the 7/29 physical count	1
93	2026-07-29	PRE-STOCKTAKE-OFFSET	75	58.000	Offset: masterlist sales predate the 7/29 physical count	1
94	2026-07-29	PRE-STOCKTAKE-OFFSET	78	29.000	Offset: masterlist sales predate the 7/29 physical count	1
95	2026-07-29	PRE-STOCKTAKE-OFFSET	73	4.000	Offset: masterlist sales predate the 7/29 physical count	1
96	2026-07-29	PRE-STOCKTAKE-OFFSET	74	25.000	Offset: masterlist sales predate the 7/29 physical count	1
97	2026-07-29	PRE-STOCKTAKE-OFFSET	72	13.000	Offset: masterlist sales predate the 7/29 physical count	1
98	2026-07-29	PRE-STOCKTAKE-OFFSET	119	10.000	Offset: masterlist sales predate the 7/29 physical count	1
99	2026-07-29	PRE-STOCKTAKE-OFFSET	82	12.000	Offset for ML-077: tracked sale predates the 7/29 physical count	1
100	2026-07-29	PRE-STOCKTAKE-OFFSET	82	8.000	Offset for ML-079: tracked sale predates the 7/29 physical count	1
101	2026-07-29	PRE-STOCKTAKE-OFFSET	57	1.000	Offset for ML-080: tracked sale predates the 7/29 physical count	1
102	2026-07-29	PRE-STOCKTAKE-OFFSET	50	4.000	Offset for ML-078: tracked sale predates the 7/29 physical count	1
103	2026-07-29	PRE-STOCKTAKE-OFFSET	52	1.000	Offset for ML-077: tracked sale predates the 7/29 physical count	1
104	2026-07-29	PRE-STOCKTAKE-OFFSET	63	2.000	Offset for ML-078: tracked sale predates the 7/29 physical count	1
105	2026-07-29	PRE-STOCKTAKE-OFFSET	66	2.000	Offset for ML-077: tracked sale predates the 7/29 physical count	1
106	2026-07-29	PRE-STOCKTAKE-OFFSET	77	2.000	Offset for ML-077: tracked sale predates the 7/29 physical count	1
107	2026-07-29	PRE-STOCKTAKE-OFFSET	77	5.000	Offset for ML-079: tracked sale predates the 7/29 physical count	1
108	2026-07-29	PRE-STOCKTAKE-OFFSET	76	2.000	Offset for ML-077: tracked sale predates the 7/29 physical count	1
109	2026-07-29	PRE-STOCKTAKE-OFFSET	75	7.000	Offset for ML-077: tracked sale predates the 7/29 physical count	1
110	2026-07-29	PRE-STOCKTAKE-OFFSET	75	10.000	Offset for ML-079: tracked sale predates the 7/29 physical count	1
111	2026-07-29	PRE-STOCKTAKE-OFFSET	75	9.000	Offset for ML-081: tracked sale predates the 7/29 physical count	1
112	2026-07-29	PRE-STOCKTAKE-OFFSET	78	4.000	Offset for ML-077: tracked sale predates the 7/29 physical count	1
113	2026-07-29	PRE-STOCKTAKE-OFFSET	78	10.000	Offset for ML-079: tracked sale predates the 7/29 physical count	1
114	2026-07-29	PRE-STOCKTAKE-OFFSET	73	3.000	Offset for ML-077: tracked sale predates the 7/29 physical count	1
115	2026-07-29	PRE-STOCKTAKE-OFFSET	73	4.000	Offset for ML-079: tracked sale predates the 7/29 physical count	1
116	2026-07-29	PRE-STOCKTAKE-OFFSET	73	2.000	Offset for ML-081: tracked sale predates the 7/29 physical count	1
117	2026-07-29	PRE-STOCKTAKE-OFFSET	74	5.000	Offset for ML-077: tracked sale predates the 7/29 physical count	1
118	2026-07-29	PRE-STOCKTAKE-OFFSET	74	8.000	Offset for ML-079: tracked sale predates the 7/29 physical count	1
139	2026-07-29	PRE-STOCKTAKE-OFFSET	107	-720.000	Offset for PO SO 1890258172: stock received before the 7/29 physical count	1
140	2026-07-29	PRE-STOCKTAKE-OFFSET	116	-120.000	Offset for PO SO 1890258173: stock received before the 7/29 physical count	1
141	2026-07-29	PRE-STOCKTAKE-OFFSET	108	-720.000	Offset for PO SO 1890258172: stock received before the 7/29 physical count	1
142	2026-07-29	PRE-STOCKTAKE-OFFSET	113	-120.000	Offset for PO SO 1890258173: stock received before the 7/29 physical count	1
143	2026-07-29	PRE-STOCKTAKE-OFFSET	117	-120.000	Offset for PO SO 1890258173: stock received before the 7/29 physical count	1
144	2026-07-29	PRE-STOCKTAKE-OFFSET	114	-120.000	Offset for PO SO 1890258173: stock received before the 7/29 physical count	1
145	2026-07-29	PRE-STOCKTAKE-OFFSET	115	-480.000	Offset for PO SO 1890258173: stock received before the 7/29 physical count	1
146	2026-07-29	PRE-STOCKTAKE-OFFSET	111	-1920.000	Offset for PO SO 1890258173: stock received before the 7/29 physical count	1
147	2026-07-29	PRE-STOCKTAKE-OFFSET	106	-10.000	Offset for PO SO 1890258177: stock received before the 7/29 physical count	1
148	2026-07-29	PRE-STOCKTAKE-OFFSET	105	-10.000	Offset for PO SO 1890258177: stock received before the 7/29 physical count	1
149	2026-07-29	PRE-STOCKTAKE-OFFSET	109	-1920.000	Offset for PO SO 1890258173: stock received before the 7/29 physical count	1
150	2026-07-29	PRE-STOCKTAKE-OFFSET	110	-1920.000	Offset for PO SO 1890258173: stock received before the 7/29 physical count	1
151	2026-07-29	PRE-STOCKTAKE-OFFSET	82	-20.000	Offset for PO SO 1890258199: stock received before the 7/29 physical count	1
152	2026-07-29	PRE-STOCKTAKE-OFFSET	82	-150.000	Offset for PO SO 1890260922: stock received before the 7/29 physical count	1
153	2026-07-29	PRE-STOCKTAKE-OFFSET	82	-50.000	Offset for PO SO 1890261898: stock received before the 7/29 physical count	1
154	2026-07-29	PRE-STOCKTAKE-OFFSET	82	-50.000	Offset for PO SO 1890269582: stock received before the 7/29 physical count	1
155	2026-07-29	PRE-STOCKTAKE-OFFSET	80	-50.000	Offset for PO SO 1890261898: stock received before the 7/29 physical count	1
156	2026-07-29	PRE-STOCKTAKE-OFFSET	83	-10.000	Offset for PO SO 1890267279: stock received before the 7/29 physical count	1
157	2026-07-29	PRE-STOCKTAKE-OFFSET	79	-30.000	Offset for PO SO 1890261898: stock received before the 7/29 physical count	1
158	2026-07-29	PRE-STOCKTAKE-OFFSET	49	-10.000	Offset for PO SO 1890258188: stock received before the 7/29 physical count	1
159	2026-07-29	PRE-STOCKTAKE-OFFSET	49	-2.000	Offset for PO SO 1890260924: stock received before the 7/29 physical count	1
160	2026-07-29	PRE-STOCKTAKE-OFFSET	49	-5.000	Offset for PO SO 1890261900: stock received before the 7/29 physical count	1
161	2026-07-29	PRE-STOCKTAKE-OFFSET	49	-50.000	Offset for PO SO 1890267274: stock received before the 7/29 physical count	1
162	2026-07-29	PRE-STOCKTAKE-OFFSET	57	-10.000	Offset for PO SO 1890258188: stock received before the 7/29 physical count	1
163	2026-07-29	PRE-STOCKTAKE-OFFSET	57	-5.000	Offset for PO SO 1890267274: stock received before the 7/29 physical count	1
164	2026-07-29	PRE-STOCKTAKE-OFFSET	50	-20.000	Offset for PO SO 1890258188: stock received before the 7/29 physical count	1
165	2026-07-29	PRE-STOCKTAKE-OFFSET	50	-4.000	Offset for PO SO 1890260924: stock received before the 7/29 physical count	1
166	2026-07-29	PRE-STOCKTAKE-OFFSET	50	-5.000	Offset for PO SO 1890261900: stock received before the 7/29 physical count	1
167	2026-07-29	PRE-STOCKTAKE-OFFSET	50	-50.000	Offset for PO SO 1890267274: stock received before the 7/29 physical count	1
168	2026-07-29	PRE-STOCKTAKE-OFFSET	50	-45.000	Offset for PO SO 1890269585: stock received before the 7/29 physical count	1
169	2026-07-29	PRE-STOCKTAKE-OFFSET	58	-10.000	Offset for PO SO 1890258188: stock received before the 7/29 physical count	1
170	2026-07-29	PRE-STOCKTAKE-OFFSET	58	-5.000	Offset for PO SO 1890267274: stock received before the 7/29 physical count	1
171	2026-07-29	PRE-STOCKTAKE-OFFSET	51	-45.000	Offset for PO SO 1890258188: stock received before the 7/29 physical count	1
172	2026-07-29	PRE-STOCKTAKE-OFFSET	51	-3.000	Offset for PO SO 1890260924: stock received before the 7/29 physical count	1
173	2026-07-29	PRE-STOCKTAKE-OFFSET	51	-20.000	Offset for PO SO 1890261900: stock received before the 7/29 physical count	1
174	2026-07-29	PRE-STOCKTAKE-OFFSET	59	-20.000	Offset for PO SO 1890258188: stock received before the 7/29 physical count	1
175	2026-07-29	PRE-STOCKTAKE-OFFSET	62	-10.000	Offset for PO SO 1890258188: stock received before the 7/29 physical count	1
176	2026-07-29	PRE-STOCKTAKE-OFFSET	62	-30.000	Offset for PO SO 1890267274: stock received before the 7/29 physical count	1
177	2026-07-29	PRE-STOCKTAKE-OFFSET	52	-40.000	Offset for PO SO 1890258188: stock received before the 7/29 physical count	1
178	2026-07-29	PRE-STOCKTAKE-OFFSET	52	-8.000	Offset for PO SO 1890260924: stock received before the 7/29 physical count	1
179	2026-07-29	PRE-STOCKTAKE-OFFSET	52	-10.000	Offset for PO SO 1890261900: stock received before the 7/29 physical count	1
180	2026-07-29	PRE-STOCKTAKE-OFFSET	52	-15.000	Offset for PO SO 1890267274: stock received before the 7/29 physical count	1
181	2026-07-29	PRE-STOCKTAKE-OFFSET	52	-40.000	Offset for PO SO 1890269585: stock received before the 7/29 physical count	1
182	2026-07-29	PRE-STOCKTAKE-OFFSET	63	-5.000	Offset for PO SO 1890258188: stock received before the 7/29 physical count	1
183	2026-07-29	PRE-STOCKTAKE-OFFSET	63	-30.000	Offset for PO SO 1890267274: stock received before the 7/29 physical count	1
184	2026-07-29	PRE-STOCKTAKE-OFFSET	54	-10.000	Offset for PO SO 1890258188: stock received before the 7/29 physical count	1
185	2026-07-29	PRE-STOCKTAKE-OFFSET	60	-5.000	Offset for PO SO 1890258188: stock received before the 7/29 physical count	1
186	2026-07-29	PRE-STOCKTAKE-OFFSET	64	-10.000	Offset for PO SO 1890258188: stock received before the 7/29 physical count	1
187	2026-07-29	PRE-STOCKTAKE-OFFSET	56	-10.000	Offset for PO SO 1890258188: stock received before the 7/29 physical count	1
188	2026-07-29	PRE-STOCKTAKE-OFFSET	56	-20.000	Offset for PO SO 1890267274: stock received before the 7/29 physical count	1
189	2026-07-29	PRE-STOCKTAKE-OFFSET	55	-20.000	Offset for PO SO 1890258188: stock received before the 7/29 physical count	1
190	2026-07-29	PRE-STOCKTAKE-OFFSET	55	-3.000	Offset for PO SO 1890260924: stock received before the 7/29 physical count	1
191	2026-07-29	PRE-STOCKTAKE-OFFSET	55	-10.000	Offset for PO SO 1890267274: stock received before the 7/29 physical count	1
192	2026-07-29	PRE-STOCKTAKE-OFFSET	61	-20.000	Offset for PO SO 1890258188: stock received before the 7/29 physical count	1
193	2026-07-29	PRE-STOCKTAKE-OFFSET	65	-10.000	Offset for PO SO 1890258188: stock received before the 7/29 physical count	1
194	2026-07-29	PRE-STOCKTAKE-OFFSET	104	-20.000	Offset for PO SO 1890258175: stock received before the 7/29 physical count	1
195	2026-07-29	PRE-STOCKTAKE-OFFSET	103	-20.000	Offset for PO SO 1890258175: stock received before the 7/29 physical count	1
196	2026-07-29	PRE-STOCKTAKE-OFFSET	102	-180.000	Offset for PO SO 1890258170: stock received before the 7/29 physical count	1
197	2026-07-29	PRE-STOCKTAKE-OFFSET	102	-132.000	Offset for PO SO 1890267283: stock received before the 7/29 physical count	1
198	2026-07-29	PRE-STOCKTAKE-OFFSET	101	-300.000	Offset for PO SO 1890258170: stock received before the 7/29 physical count	1
199	2026-07-29	PRE-STOCKTAKE-OFFSET	101	-132.000	Offset for PO SO 1890267283: stock received before the 7/29 physical count	1
200	2026-07-29	PRE-STOCKTAKE-OFFSET	87	-50.000	Offset for PO SO 1890258194: stock received before the 7/29 physical count	1
201	2026-07-29	PRE-STOCKTAKE-OFFSET	87	-5.000	Offset for PO SO 1890260925: stock received before the 7/29 physical count	1
202	2026-07-29	PRE-STOCKTAKE-OFFSET	90	-40.000	Offset for PO SO 1890258194: stock received before the 7/29 physical count	1
203	2026-07-29	PRE-STOCKTAKE-OFFSET	90	-20.000	Offset for PO SO 1890271973: stock received before the 7/29 physical count	1
204	2026-07-29	PRE-STOCKTAKE-OFFSET	85	-100.000	Offset for PO SO 1890258194: stock received before the 7/29 physical count	1
205	2026-07-29	PRE-STOCKTAKE-OFFSET	85	-15.000	Offset for PO SO 1890260925: stock received before the 7/29 physical count	1
206	2026-07-29	PRE-STOCKTAKE-OFFSET	85	-20.000	Offset for PO SO 1890267277: stock received before the 7/29 physical count	1
207	2026-07-29	PRE-STOCKTAKE-OFFSET	88	-40.000	Offset for PO SO 1890258194: stock received before the 7/29 physical count	1
208	2026-07-29	PRE-STOCKTAKE-OFFSET	88	-5.000	Offset for PO SO 1890267277: stock received before the 7/29 physical count	1
209	2026-07-29	PRE-STOCKTAKE-OFFSET	88	-130.000	Offset for PO SO 1890271973: stock received before the 7/29 physical count	1
210	2026-07-29	PRE-STOCKTAKE-OFFSET	86	-40.000	Offset for PO SO 1890258194: stock received before the 7/29 physical count	1
211	2026-07-29	PRE-STOCKTAKE-OFFSET	86	-20.000	Offset for PO SO 1890267277: stock received before the 7/29 physical count	1
212	2026-07-29	PRE-STOCKTAKE-OFFSET	89	-40.000	Offset for PO SO 1890258194: stock received before the 7/29 physical count	1
213	2026-07-29	PRE-STOCKTAKE-OFFSET	89	-5.000	Offset for PO SO 1890267277: stock received before the 7/29 physical count	1
214	2026-07-29	PRE-STOCKTAKE-OFFSET	89	-10.000	Offset for PO SO 1890271973: stock received before the 7/29 physical count	1
215	2026-07-29	PRE-STOCKTAKE-OFFSET	84	-30.000	Offset for PO SO 1890258194: stock received before the 7/29 physical count	1
216	2026-07-29	PRE-STOCKTAKE-OFFSET	84	-5.000	Offset for PO SO 1890260925: stock received before the 7/29 physical count	1
217	2026-07-29	PRE-STOCKTAKE-OFFSET	84	-20.000	Offset for PO SO 1890267277: stock received before the 7/29 physical count	1
218	2026-07-29	PRE-STOCKTAKE-OFFSET	118	-120.000	Offset for PO SO 1890258173: stock received before the 7/29 physical count	1
219	2026-07-29	PRE-STOCKTAKE-OFFSET	66	-10.000	Offset for PO SO 1890258199: stock received before the 7/29 physical count	1
220	2026-07-29	PRE-STOCKTAKE-OFFSET	66	-6.000	Offset for PO SO 1890260922: stock received before the 7/29 physical count	1
221	2026-07-29	PRE-STOCKTAKE-OFFSET	77	-20.000	Offset for PO SO 1890258199: stock received before the 7/29 physical count	1
222	2026-07-29	PRE-STOCKTAKE-OFFSET	77	-10.000	Offset for PO SO 1890267279: stock received before the 7/29 physical count	1
223	2026-07-29	PRE-STOCKTAKE-OFFSET	76	-20.000	Offset for PO SO 1890258199: stock received before the 7/29 physical count	1
224	2026-07-29	PRE-STOCKTAKE-OFFSET	76	-30.000	Offset for PO SO 1890260922: stock received before the 7/29 physical count	1
225	2026-07-29	PRE-STOCKTAKE-OFFSET	76	-10.000	Offset for PO SO 1890261898: stock received before the 7/29 physical count	1
226	2026-07-29	PRE-STOCKTAKE-OFFSET	76	-10.000	Offset for PO SO 1890267279: stock received before the 7/29 physical count	1
227	2026-07-29	PRE-STOCKTAKE-OFFSET	75	-40.000	Offset for PO SO 1890258199: stock received before the 7/29 physical count	1
228	2026-07-29	PRE-STOCKTAKE-OFFSET	75	-200.000	Offset for PO SO 1890260922: stock received before the 7/29 physical count	1
229	2026-07-29	PRE-STOCKTAKE-OFFSET	75	-70.000	Offset for PO SO 1890261898: stock received before the 7/29 physical count	1
230	2026-07-29	PRE-STOCKTAKE-OFFSET	75	-80.000	Offset for PO SO 1890267279: stock received before the 7/29 physical count	1
231	2026-07-29	PRE-STOCKTAKE-OFFSET	78	-20.000	Offset for PO SO 1890258199: stock received before the 7/29 physical count	1
232	2026-07-29	PRE-STOCKTAKE-OFFSET	78	-80.000	Offset for PO SO 1890267279: stock received before the 7/29 physical count	1
233	2026-07-29	PRE-STOCKTAKE-OFFSET	73	-10.000	Offset for PO SO 1890258199: stock received before the 7/29 physical count	1
234	2026-07-29	PRE-STOCKTAKE-OFFSET	73	-10.000	Offset for PO SO 1890260922: stock received before the 7/29 physical count	1
235	2026-07-29	PRE-STOCKTAKE-OFFSET	73	-40.000	Offset for PO SO 1890261898: stock received before the 7/29 physical count	1
236	2026-07-29	PRE-STOCKTAKE-OFFSET	74	-20.000	Offset for PO SO 1890258199: stock received before the 7/29 physical count	1
237	2026-07-29	PRE-STOCKTAKE-OFFSET	74	-60.000	Offset for PO SO 1890260922: stock received before the 7/29 physical count	1
238	2026-07-29	PRE-STOCKTAKE-OFFSET	74	-30.000	Offset for PO SO 1890261898: stock received before the 7/29 physical count	1
239	2026-07-29	PRE-STOCKTAKE-OFFSET	74	-80.000	Offset for PO SO 1890267279: stock received before the 7/29 physical count	1
240	2026-07-29	PRE-STOCKTAKE-OFFSET	74	-50.000	Offset for PO SO 1890269582: stock received before the 7/29 physical count	1
241	2026-07-29	PRE-STOCKTAKE-OFFSET	72	-50.000	Offset for PO SO 1890260922: stock received before the 7/29 physical count	1
242	2026-07-29	PRE-STOCKTAKE-OFFSET	72	-20.000	Offset for PO SO 1890261898: stock received before the 7/29 physical count	1
243	2026-07-29	PRE-STOCKTAKE-OFFSET	119	-10.000	Offset for PO SO 1890258174: stock received before the 7/29 physical count	1
244	2026-07-29	PRE-STOCKTAKE-OFFSET	112	-720.000	Offset for PO SO 1890258173: stock received before the 7/29 physical count	1
\.


--
-- Data for Name: notification_reads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_reads (user_name, last_id) FROM stdin;
Glomer Celestino	6
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, ts, actor, kind, message) FROM stdin;
2	2026-08-09 02:57:40.860364+08	Romel Nabong	visit	Romel Nabong logged a store visit — Greenfield Agrivet Supply
3	2026-08-09 19:07:55.112756+08	Glomer Celestino	payment	Glomer Celestino received a payment of ₱4,340.00
4	2026-08-09 19:07:55.435805+08	Glomer Celestino	payment	Glomer Celestino received a payment of ₱6,460.00
5	2026-08-09 19:16:59.934375+08	Henry Benjamin Cuyuca	transfer	Henry Benjamin Cuyuca transferred ₱250.00 between accounts
6	2026-08-09 19:22:18.566543+08	Henry Benjamin Cuyuca	claim	Henry Benjamin Cuyuca drafted a URC claim — ₱1.00
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, sale_id, date, amount, account_id, or_no, notes, version) FROM stdin;
13	21	2026-05-20	11000.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
68	87	2026-08-01	4340.00	6	\N	UnionBank check #0000122878	1
69	90	2026-08-04	6460.00	6	\N	UnionBank check #0000122879	1
52	73	2026-08-07	56300.00	6	\N	RCBC check #0009011172 � Thessa Rice and Corn Retailer (eWMN) � masterlist marked PAID, check received 08-07	2
56	85	2026-07-17	20130.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
55	83	2026-07-15	4440.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
54	80	2026-07-11	6700.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
53	77	2026-07-09	43400.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
51	72	2026-07-07	7852.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
50	64	2026-07-04	29150.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
49	61	2026-07-03	7000.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
48	60	2026-07-03	24500.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
47	59	2026-06-30	3700.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
14	22	2026-05-20	31715.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
46	58	2026-06-30	8580.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
45	57	2026-06-29	29525.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
44	56	2026-06-26	11500.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
43	55	2026-06-24	1905.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
42	54	2026-06-24	48880.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
41	53	2026-06-20	29510.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
40	52	2026-06-20	11290.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
39	51	2026-06-20	6450.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
38	50	2026-06-20	6200.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
37	49	2026-06-17	1785.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
36	48	2026-06-17	30437.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
35	47	2026-06-16	43050.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
58	92	2026-05-20	10380.00	4	\N	Checked masterlist — DR tracked (blue), marked PAID	2
34	46	2026-06-16	13480.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
33	45	2026-06-16	1100.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
32	44	2026-06-08	5355.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
31	43	2026-06-08	34140.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
30	40	2026-06-04	14690.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
29	38	2026-06-04	23205.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
28	37	2026-06-04	28700.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
27	36	2026-06-01	19600.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
26	35	2026-05-28	22430.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
25	34	2026-05-28	4630.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
24	32	2026-05-28	13680.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
23	31	2026-05-28	2280.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
22	30	2026-05-28	27360.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
61	95	2026-05-26	19100.00	4	\N	Checked masterlist — DR tracked (blue), marked PAID	2
21	29	2026-05-26	4560.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
15	23	2026-05-22	5100.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
20	28	2026-05-26	14995.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
19	27	2026-05-26	4360.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
18	26	2026-05-25	1855.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
17	25	2026-05-25	28015.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
16	24	2026-05-23	10485.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
60	94	2026-05-22	1160.00	4	\N	Checked masterlist — DR tracked (blue), marked PAID	2
59	93	2026-05-22	80270.00	4	\N	Checked masterlist — DR tracked (blue), marked PAID	2
11	19	2026-05-16	23700.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
10	18	2026-05-16	26265.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
57	91	2026-05-15	68020.00	4	\N	Checked masterlist — DR tracked (blue), marked PAID	2
12	20	2026-05-15	18000.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
9	17	2026-05-14	14255.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
8	16	2026-05-14	9650.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
7	15	2026-05-14	8100.00	4	\N	Masterlist import — marked PAID (account not recorded)	2
\.


--
-- Data for Name: payroll_runs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payroll_runs (id, user_name, period_from, period_to, days, hours, daily_rate, gross_dtr, commission, sss, philhealth, pagibig, other_ded, net, notes, created_at, version) FROM stdin;
\.


--
-- Data for Name: profit_goals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profit_goals (id, year, goal, achieved, version) FROM stdin;
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchases (id, order_date, received_date, ref_id, item_id, purchase_qty, received_qty, unit_cost, account_id, status, vendor_id, notes, version, expiry_date) FROM stdin;
42	2026-05-07	2026-05-07	SO 1890258173	110	320.000	320.000	0.00	\N	Received	2	URC Sales Order 1890258173 FREE GOODS (deal); SO gross 0/unit, net cost after SO discounts	1	\N
3	2026-05-07	2026-05-07	SO 1890258188	50	20.000	20.000	1695.98	\N	Received	2	URC Sales Order 1890258188; SO gross 2040/unit, net cost after SO discounts	1	\N
4	2026-05-07	2026-05-07	SO 1890258188	51	45.000	45.000	1679.36	\N	Received	2	URC Sales Order 1890258188; SO gross 2020/unit, net cost after SO discounts	1	\N
5	2026-05-07	2026-05-07	SO 1890258188	52	40.000	40.000	1454.89	\N	Received	2	URC Sales Order 1890258188; SO gross 1750/unit, net cost after SO discounts	1	\N
6	2026-05-07	2026-05-07	SO 1890258188	54	10.000	10.000	1754.18	\N	Received	2	URC Sales Order 1890258188; SO gross 2110/unit, net cost after SO discounts	1	\N
7	2026-05-07	2026-05-07	SO 1890258188	55	20.000	20.000	1629.48	\N	Received	2	URC Sales Order 1890258188; SO gross 1960/unit, net cost after SO discounts	1	\N
8	2026-05-07	2026-05-07	SO 1890258188	56	10.000	10.000	831.36	\N	Received	2	URC Sales Order 1890258188; SO gross 1000/unit, net cost after SO discounts	1	\N
9	2026-05-07	2026-05-07	SO 1890258188	57	10.000	10.000	1011.77	\N	Received	2	URC Sales Order 1890258188; SO gross 1217/unit, net cost after SO discounts	1	\N
10	2026-05-07	2026-05-07	SO 1890258188	58	10.000	10.000	922.81	\N	Received	2	URC Sales Order 1890258188; SO gross 1110/unit, net cost after SO discounts	1	\N
11	2026-05-07	2026-05-07	SO 1890258188	59	20.000	20.000	897.87	\N	Received	2	URC Sales Order 1890258188; SO gross 1080/unit, net cost after SO discounts	1	\N
12	2026-05-07	2026-05-07	SO 1890258188	60	5.000	5.000	943.60	\N	Received	2	URC Sales Order 1890258188; SO gross 1135/unit, net cost after SO discounts	1	\N
13	2026-05-07	2026-05-07	SO 1890258188	61	20.000	20.000	872.93	\N	Received	2	URC Sales Order 1890258188; SO gross 1050/unit, net cost after SO discounts	1	\N
14	2026-05-07	2026-05-07	SO 1890258188	62	10.000	10.000	1126.50	\N	Received	2	URC Sales Order 1890258188; SO gross 1355/unit, net cost after SO discounts	1	\N
15	2026-05-07	2026-05-07	SO 1890258188	63	5.000	5.000	1147.28	\N	Received	2	URC Sales Order 1890258188; SO gross 1380/unit, net cost after SO discounts	1	\N
16	2026-05-07	2026-05-07	SO 1890258188	64	10.000	10.000	877.09	\N	Received	2	URC Sales Order 1890258188; SO gross 1055/unit, net cost after SO discounts	1	\N
17	2026-05-07	2026-05-07	SO 1890258188	65	10.000	10.000	910.34	\N	Received	2	URC Sales Order 1890258188; SO gross 1095/unit, net cost after SO discounts	1	\N
18	2026-05-07	2026-05-07	SO 1890258194	84	30.000	30.000	1585.51	\N	Received	2	URC Sales Order 1890258194; SO gross 1695/unit, net cost after SO discounts	1	\N
19	2026-05-07	2026-05-07	SO 1890258194	85	100.000	100.000	1342.31	\N	Received	2	URC Sales Order 1890258194; SO gross 1435/unit, net cost after SO discounts	1	\N
20	2026-05-07	2026-05-07	SO 1890258194	86	40.000	40.000	1391.88	\N	Received	2	URC Sales Order 1890258194; SO gross 1488/unit, net cost after SO discounts	1	\N
21	2026-05-07	2026-05-07	SO 1890258194	89	40.000	40.000	356.86	\N	Received	2	URC Sales Order 1890258194; SO gross 381.5/unit, net cost after SO discounts	1	\N
22	2026-05-07	2026-05-07	SO 1890258194	87	50.000	50.000	1917.12	\N	Received	2	URC Sales Order 1890258194; SO gross 2049.51/unit, net cost after SO discounts	1	\N
23	2026-05-07	2026-05-07	SO 1890258194	90	40.000	40.000	491.90	\N	Received	2	URC Sales Order 1890258194; SO gross 525.87/unit, net cost after SO discounts	1	\N
24	2026-05-07	2026-05-07	SO 1890258194	88	40.000	40.000	347.50	\N	Received	2	URC Sales Order 1890258194; SO gross 371.5/unit, net cost after SO discounts	1	\N
25	2026-05-07	2026-05-07	SO 1890258199	66	10.000	10.000	2040.54	\N	Received	2	URC Sales Order 1890258199; SO gross 2315/unit, net cost after SO discounts	1	\N
26	2026-05-07	2026-05-07	SO 1890258199	73	10.000	10.000	1282.50	\N	Received	2	URC Sales Order 1890258199; SO gross 1455/unit, net cost after SO discounts	1	\N
27	2026-05-07	2026-05-07	SO 1890258199	74	20.000	20.000	1727.63	\N	Received	2	URC Sales Order 1890258199; SO gross 1960/unit, net cost after SO discounts	1	\N
28	2026-05-07	2026-05-07	SO 1890258199	75	40.000	40.000	1586.60	\N	Received	2	URC Sales Order 1890258199; SO gross 1800/unit, net cost after SO discounts	1	\N
29	2026-05-07	2026-05-07	SO 1890258199	76	20.000	20.000	1560.15	\N	Received	2	URC Sales Order 1890258199; SO gross 1770/unit, net cost after SO discounts	1	\N
30	2026-05-07	2026-05-07	SO 1890258199	77	20.000	20.000	1546.93	\N	Received	2	URC Sales Order 1890258199; SO gross 1755/unit, net cost after SO discounts	1	\N
31	2026-05-07	2026-05-07	SO 1890258199	78	20.000	20.000	1661.52	\N	Received	2	URC Sales Order 1890258199; SO gross 1885/unit, net cost after SO discounts	1	\N
32	2026-05-07	2026-05-07	SO 1890258199	82	20.000	20.000	1494.05	\N	Received	2	URC Sales Order 1890258199; SO gross 1695/unit, net cost after SO discounts	1	\N
33	2026-05-07	2026-05-07	SO 1890258170	101	300.000	300.000	170.24	\N	Received	2	URC Sales Order 1890258170 (100 x 3-pc bundle); SO gross 555/unit, net cost after SO discounts	1	\N
34	2026-05-07	2026-05-07	SO 1890258170	102	180.000	180.000	170.24	\N	Received	2	URC Sales Order 1890258170 (60 x 3-pc bundle); SO gross 555/unit, net cost after SO discounts	1	\N
35	2026-05-07	2026-05-07	SO 1890258172	107	600.000	600.000	13.55	\N	Received	2	URC Sales Order 1890258172; SO gross 21/unit, net cost after SO discounts	1	\N
36	2026-05-07	2026-05-07	SO 1890258172	107	120.000	120.000	0.00	\N	Received	2	URC Sales Order 1890258172 FREE GOODS (deal); SO gross 0/unit, net cost after SO discounts	1	\N
37	2026-05-07	2026-05-07	SO 1890258172	108	600.000	600.000	14.84	\N	Received	2	URC Sales Order 1890258172; SO gross 23/unit, net cost after SO discounts	1	\N
38	2026-05-07	2026-05-07	SO 1890258172	108	120.000	120.000	0.00	\N	Received	2	URC Sales Order 1890258172 FREE GOODS (deal); SO gross 0/unit, net cost after SO discounts	1	\N
39	2026-05-07	2026-05-07	SO 1890258173	109	1600.000	1600.000	14.19	\N	Received	2	URC Sales Order 1890258173; SO gross 22/unit, net cost after SO discounts	1	\N
40	2026-05-07	2026-05-07	SO 1890258173	109	320.000	320.000	0.00	\N	Received	2	URC Sales Order 1890258173 FREE GOODS (deal); SO gross 0/unit, net cost after SO discounts	1	\N
41	2026-05-07	2026-05-07	SO 1890258173	110	1600.000	1600.000	21.93	\N	Received	2	URC Sales Order 1890258173; SO gross 34/unit, net cost after SO discounts	1	\N
43	2026-05-07	2026-05-07	SO 1890258173	111	1600.000	1600.000	14.19	\N	Received	2	URC Sales Order 1890258173; SO gross 22/unit, net cost after SO discounts	1	\N
44	2026-05-07	2026-05-07	SO 1890258173	111	320.000	320.000	0.00	\N	Received	2	URC Sales Order 1890258173 FREE GOODS (deal); SO gross 0/unit, net cost after SO discounts	1	\N
45	2026-05-07	2026-05-07	SO 1890258173	112	600.000	600.000	7.74	\N	Received	2	URC Sales Order 1890258173; SO gross 12/unit, net cost after SO discounts	1	\N
46	2026-05-07	2026-05-07	SO 1890258173	112	120.000	120.000	0.00	\N	Received	2	URC Sales Order 1890258173 FREE GOODS (deal); SO gross 0/unit, net cost after SO discounts	1	\N
47	2026-05-07	2026-05-07	SO 1890258173	113	100.000	100.000	281.27	\N	Received	2	URC Sales Order 1890258173; SO gross 436/unit, net cost after SO discounts	1	\N
48	2026-05-07	2026-05-07	SO 1890258173	113	20.000	20.000	0.00	\N	Received	2	URC Sales Order 1890258173 FREE GOODS (deal); SO gross 0/unit, net cost after SO discounts	1	\N
49	2026-05-07	2026-05-07	SO 1890258173	114	100.000	100.000	78.70	\N	Received	2	URC Sales Order 1890258173; SO gross 122/unit, net cost after SO discounts	1	\N
50	2026-05-07	2026-05-07	SO 1890258173	114	20.000	20.000	0.00	\N	Received	2	URC Sales Order 1890258173 FREE GOODS (deal); SO gross 0/unit, net cost after SO discounts	1	\N
51	2026-05-07	2026-05-07	SO 1890258173	115	400.000	400.000	28.39	\N	Received	2	URC Sales Order 1890258173; SO gross 44/unit, net cost after SO discounts	1	\N
52	2026-05-07	2026-05-07	SO 1890258173	115	80.000	80.000	0.00	\N	Received	2	URC Sales Order 1890258173 FREE GOODS (deal); SO gross 0/unit, net cost after SO discounts	1	\N
53	2026-05-07	2026-05-07	SO 1890258173	116	100.000	100.000	305.14	\N	Received	2	URC Sales Order 1890258173; SO gross 473/unit, net cost after SO discounts	1	\N
54	2026-05-07	2026-05-07	SO 1890258173	116	20.000	20.000	0.00	\N	Received	2	URC Sales Order 1890258173 FREE GOODS (deal); SO gross 0/unit, net cost after SO discounts	1	\N
55	2026-05-07	2026-05-07	SO 1890258173	117	100.000	100.000	256.11	\N	Received	2	URC Sales Order 1890258173; SO gross 397/unit, net cost after SO discounts	1	\N
56	2026-05-07	2026-05-07	SO 1890258173	117	20.000	20.000	0.00	\N	Received	2	URC Sales Order 1890258173 FREE GOODS (deal); SO gross 0/unit, net cost after SO discounts	1	\N
57	2026-05-07	2026-05-07	SO 1890258173	118	100.000	100.000	248.37	\N	Received	2	URC Sales Order 1890258173; SO gross 385/unit, net cost after SO discounts	1	\N
58	2026-05-07	2026-05-07	SO 1890258173	118	20.000	20.000	0.00	\N	Received	2	URC Sales Order 1890258173 FREE GOODS (deal); SO gross 0/unit, net cost after SO discounts	1	\N
59	2026-05-07	2026-05-07	SO 1890258174	119	10.000	10.000	843.36	\N	Received	2	URC Sales Order 1890258174; SO gross 1050/unit, net cost after SO discounts	1	\N
60	2026-05-07	2026-05-07	SO 1890258175	103	20.000	20.000	2427.49	\N	Received	2	URC Sales Order 1890258175; SO gross 3305/unit, net cost after SO discounts	1	\N
61	2026-05-07	2026-05-07	SO 1890258175	104	20.000	20.000	1817.87	\N	Received	2	URC Sales Order 1890258175; SO gross 2475/unit, net cost after SO discounts	1	\N
62	2026-05-07	2026-05-07	SO 1890258177	106	10.000	10.000	1714.80	\N	Received	2	URC Sales Order 1890258177; SO gross 2160/unit, net cost after SO discounts	1	\N
63	2026-05-07	2026-05-07	SO 1890258177	105	10.000	10.000	3163.64	\N	Received	2	URC Sales Order 1890258177; SO gross 3985/unit, net cost after SO discounts	1	\N
64	2026-05-21	2026-05-21	SO 1890260922	66	6.000	6.000	2057.16	\N	Received	2	URC Sales Order 1890260922; SO gross 2340/unit, net cost after SO discounts	1	\N
65	2026-05-21	2026-05-21	SO 1890260922	73	10.000	10.000	1301.11	\N	Received	2	URC Sales Order 1890260922; SO gross 1480/unit, net cost after SO discounts	1	\N
66	2026-05-21	2026-05-21	SO 1890260922	74	60.000	60.000	1767.04	\N	Received	2	URC Sales Order 1890260922; SO gross 2010/unit, net cost after SO discounts	1	\N
67	2026-05-21	2026-05-21	SO 1890260922	75	200.000	200.000	1626.38	\N	Received	2	URC Sales Order 1890260922; SO gross 1850/unit, net cost after SO discounts	1	\N
68	2026-05-21	2026-05-21	SO 1890260922	76	30.000	30.000	1600.01	\N	Received	2	URC Sales Order 1890260922; SO gross 1820/unit, net cost after SO discounts	1	\N
69	2026-05-21	2026-05-21	SO 1890260922	82	150.000	150.000	1534.08	\N	Received	2	URC Sales Order 1890260922; SO gross 1745/unit, net cost after SO discounts	1	\N
70	2026-05-21	2026-05-21	SO 1890260922	72	50.000	50.000	1736.28	\N	Received	2	URC Sales Order 1890260922; SO gross 1975/unit, net cost after SO discounts	1	\N
71	2026-05-21	2026-05-21	SO 1890260924	49	2.000	2.000	1937.28	\N	Received	2	URC Sales Order 1890260924; SO gross 2340/unit, net cost after SO discounts	1	\N
72	2026-05-21	2026-05-21	SO 1890260924	50	4.000	4.000	1730.31	\N	Received	2	URC Sales Order 1890260924; SO gross 2090/unit, net cost after SO discounts	1	\N
73	2026-05-21	2026-05-21	SO 1890260924	52	8.000	8.000	1490.22	\N	Received	2	URC Sales Order 1890260924; SO gross 1800/unit, net cost after SO discounts	1	\N
74	2026-05-21	2026-05-21	SO 1890260924	51	3.000	3.000	1713.75	\N	Received	2	URC Sales Order 1890260924; SO gross 2070/unit, net cost after SO discounts	1	\N
75	2026-05-21	2026-05-21	SO 1890260924	55	3.000	3.000	1664.08	\N	Received	2	URC Sales Order 1890260924; SO gross 2010/unit, net cost after SO discounts	1	\N
76	2026-05-21	2026-05-21	SO 1890260925	85	15.000	15.000	1360.77	\N	Received	2	URC Sales Order 1890260925; SO gross 1455/unit, net cost after SO discounts	1	\N
77	2026-05-21	2026-05-21	SO 1890260925	84	5.000	5.000	1594.58	\N	Received	2	URC Sales Order 1890260925; SO gross 1705/unit, net cost after SO discounts	1	\N
78	2026-05-21	2026-05-21	SO 1890260925	87	5.000	5.000	1935.49	\N	Received	2	URC Sales Order 1890260925; SO gross 2069.51/unit, net cost after SO discounts	1	\N
79	2026-05-26	2026-05-26	SO 1890261898	73	40.000	40.000	1303.53	\N	Received	2	URC Sales Order 1890261898; SO gross 1480/unit, net cost after SO discounts	1	\N
80	2026-05-26	2026-05-26	SO 1890261898	74	30.000	30.000	1770.33	\N	Received	2	URC Sales Order 1890261898; SO gross 2010/unit, net cost after SO discounts	1	\N
81	2026-05-26	2026-05-26	SO 1890261898	75	70.000	70.000	1629.41	\N	Received	2	URC Sales Order 1890261898; SO gross 1850/unit, net cost after SO discounts	1	\N
82	2026-05-26	2026-05-26	SO 1890261898	76	10.000	10.000	1602.99	\N	Received	2	URC Sales Order 1890261898; SO gross 1820/unit, net cost after SO discounts	1	\N
83	2026-05-26	2026-05-26	SO 1890261898	72	20.000	20.000	1739.50	\N	Received	2	URC Sales Order 1890261898; SO gross 1975/unit, net cost after SO discounts	1	\N
84	2026-05-26	2026-05-26	SO 1890261898	79	30.000	30.000	1677.85	\N	Received	2	URC Sales Order 1890261898; SO gross 1905/unit, net cost after SO discounts	1	\N
85	2026-05-26	2026-05-26	SO 1890261898	80	50.000	50.000	1528.12	\N	Received	2	URC Sales Order 1890261898; SO gross 1735/unit, net cost after SO discounts	1	\N
86	2026-05-26	2026-05-26	SO 1890261898	82	50.000	50.000	1536.93	\N	Received	2	URC Sales Order 1890261898; SO gross 1745/unit, net cost after SO discounts	1	\N
87	2026-05-26	2026-05-26	SO 1890261900	49	5.000	5.000	1944.95	\N	Received	2	URC Sales Order 1890261900; SO gross 2340/unit, net cost after SO discounts	1	\N
88	2026-05-26	2026-05-26	SO 1890261900	50	5.000	5.000	1737.16	\N	Received	2	URC Sales Order 1890261900; SO gross 2090/unit, net cost after SO discounts	1	\N
89	2026-05-26	2026-05-26	SO 1890261900	51	20.000	20.000	1720.54	\N	Received	2	URC Sales Order 1890261900; SO gross 2070/unit, net cost after SO discounts	1	\N
90	2026-05-26	2026-05-26	SO 1890261900	52	10.000	10.000	1496.12	\N	Received	2	URC Sales Order 1890261900; SO gross 1800/unit, net cost after SO discounts	1	\N
91	2026-06-29	2026-06-29	SO 1890267274	49	50.000	50.000	1972.39	\N	Received	2	URC Sales Order 1890267274; SO gross 2340/unit, net cost after SO discounts	1	\N
92	2026-06-29	2026-06-29	SO 1890267274	50	50.000	50.000	1761.67	\N	Received	2	URC Sales Order 1890267274; SO gross 2090/unit, net cost after SO discounts	1	\N
93	2026-06-29	2026-06-29	SO 1890267274	52	15.000	15.000	1517.23	\N	Received	2	URC Sales Order 1890267274; SO gross 1800/unit, net cost after SO discounts	1	\N
94	2026-06-29	2026-06-29	SO 1890267274	55	10.000	10.000	1694.24	\N	Received	2	URC Sales Order 1890267274; SO gross 2010/unit, net cost after SO discounts	1	\N
95	2026-06-29	2026-06-29	SO 1890267274	56	20.000	20.000	863.98	\N	Received	2	URC Sales Order 1890267274; SO gross 1025/unit, net cost after SO discounts	1	\N
96	2026-06-29	2026-06-29	SO 1890267274	57	5.000	5.000	1046.89	\N	Received	2	URC Sales Order 1890267274; SO gross 1242/unit, net cost after SO discounts	1	\N
97	2026-06-29	2026-06-29	SO 1890267274	58	5.000	5.000	956.70	\N	Received	2	URC Sales Order 1890267274; SO gross 1135/unit, net cost after SO discounts	1	\N
98	2026-06-29	2026-06-29	SO 1890267274	62	30.000	30.000	1163.21	\N	Received	2	URC Sales Order 1890267274; SO gross 1380/unit, net cost after SO discounts	1	\N
99	2026-06-29	2026-06-29	SO 1890267274	63	30.000	30.000	1184.28	\N	Received	2	URC Sales Order 1890267274; SO gross 1405/unit, net cost after SO discounts	1	\N
100	2026-06-29	2026-06-29	SO 1890267277	84	20.000	20.000	1584.26	\N	Received	2	URC Sales Order 1890267277; SO gross 1705/unit, net cost after SO discounts	1	\N
101	2026-06-29	2026-06-29	SO 1890267277	85	20.000	20.000	1351.97	\N	Received	2	URC Sales Order 1890267277; SO gross 1455/unit, net cost after SO discounts	1	\N
102	2026-06-29	2026-06-29	SO 1890267277	86	20.000	20.000	1401.21	\N	Received	2	URC Sales Order 1890267277; SO gross 1508/unit, net cost after SO discounts	1	\N
103	2026-06-29	2026-06-29	SO 1890267277	88	5.000	5.000	349.84	\N	Received	2	URC Sales Order 1890267277; SO gross 376.5/unit, net cost after SO discounts	1	\N
104	2026-06-29	2026-06-29	SO 1890267277	89	5.000	5.000	359.13	\N	Received	2	URC Sales Order 1890267277; SO gross 386.5/unit, net cost after SO discounts	1	\N
105	2026-06-29	2026-06-29	SO 1890267279	74	80.000	80.000	1770.33	\N	Received	2	URC Sales Order 1890267279; SO gross 2010/unit, net cost after SO discounts	1	\N
106	2026-06-29	2026-06-29	SO 1890267279	75	80.000	80.000	1629.41	\N	Received	2	URC Sales Order 1890267279; SO gross 1850/unit, net cost after SO discounts	1	\N
107	2026-06-29	2026-06-29	SO 1890267279	76	10.000	10.000	1602.99	\N	Received	2	URC Sales Order 1890267279; SO gross 1820/unit, net cost after SO discounts	1	\N
108	2026-06-29	2026-06-29	SO 1890267279	77	10.000	10.000	1589.78	\N	Received	2	URC Sales Order 1890267279; SO gross 1805/unit, net cost after SO discounts	1	\N
109	2026-06-29	2026-06-29	SO 1890267279	78	80.000	80.000	1704.28	\N	Received	2	URC Sales Order 1890267279; SO gross 1935/unit, net cost after SO discounts	1	\N
110	2026-06-29	2026-06-29	SO 1890267279	83	10.000	10.000	1655.83	\N	Received	2	URC Sales Order 1890267279; SO gross 1880/unit, net cost after SO discounts	1	\N
111	2026-06-29	2026-06-29	SO 1890267283	101	120.000	120.000	170.24	\N	Received	2	URC Sales Order 1890267283 (40 x 3-pc bundle); SO gross 555/unit, net cost after SO discounts	1	\N
112	2026-06-29	2026-06-29	SO 1890267283	101	12.000	12.000	0.00	\N	Received	2	URC Sales Order 1890267283 FREE GOODS (deal) (4 x 3-pc bundle); SO gross 0/unit, net cost after SO discounts	1	\N
113	2026-06-29	2026-06-29	SO 1890267283	102	120.000	120.000	170.24	\N	Received	2	URC Sales Order 1890267283 (40 x 3-pc bundle); SO gross 555/unit, net cost after SO discounts	1	\N
114	2026-06-29	2026-06-29	SO 1890267283	102	12.000	12.000	0.00	\N	Received	2	URC Sales Order 1890267283 FREE GOODS (deal) (4 x 3-pc bundle); SO gross 0/unit, net cost after SO discounts	1	\N
115	2026-07-13	2026-07-13	SO 1890269585	50	45.000	45.000	1726.33	\N	Received	2	URC Sales Order 1890269585; SO gross 2090/unit, net cost after SO discounts	1	\N
116	2026-07-13	2026-07-13	SO 1890269585	52	40.000	40.000	1486.79	\N	Received	2	URC Sales Order 1890269585; SO gross 1800/unit, net cost after SO discounts	1	\N
117	2026-07-13	2026-07-13	SO 1890269582	82	50.000	50.000	1534.14	\N	Received	2	URC Sales Order 1890269582; SO gross 1745/unit, net cost after SO discounts	1	\N
118	2026-07-13	2026-07-13	SO 1890269582	74	50.000	50.000	1767.11	\N	Received	2	URC Sales Order 1890269582; SO gross 2010/unit, net cost after SO discounts	1	\N
119	2026-07-24	2026-07-24	SO 1890271973	88	130.000	130.000	350.83	\N	Received	2	URC Sales Order 1890271973; SO gross 376.5/unit, net cost after SO discounts	1	\N
120	2026-07-24	2026-07-24	SO 1890271973	90	20.000	20.000	494.67	\N	Received	2	URC Sales Order 1890271973; SO gross 530.87/unit, net cost after SO discounts	1	\N
121	2026-07-24	2026-07-24	SO 1890271973	89	10.000	10.000	360.15	\N	Received	2	URC Sales Order 1890271973; SO gross 386.5/unit, net cost after SO discounts	1	\N
122	2026-07-30	2026-07-30	SO 1890273013	57	4.000	4.000	1046.65	\N	Received	2	URC Sales Order 1890273013; SO gross 1242/unit, net cost after SO discounts	1	\N
123	2026-07-30	2026-07-30	SO 1890273013	59	6.000	6.000	931.20	\N	Received	2	URC Sales Order 1890273013; SO gross 1105/unit, net cost after SO discounts	1	\N
124	2026-07-30	2026-07-30	SO 1890273013	60	4.000	4.000	977.55	\N	Received	2	URC Sales Order 1890273013; SO gross 1160/unit, net cost after SO discounts	1	\N
125	2026-07-30	2026-07-30	SO 1890273013	61	8.000	8.000	905.92	\N	Received	2	URC Sales Order 1890273013; SO gross 1075/unit, net cost after SO discounts	1	\N
126	2026-07-30	2026-07-30	SO 1890273015	85	40.000	40.000	1364.38	\N	Received	2	URC Sales Order 1890273015; SO gross 1455/unit, net cost after SO discounts	1	\N
127	2026-07-30	2026-07-30	SO 1890273015	87	20.000	20.000	1940.62	\N	Received	2	URC Sales Order 1890273015; SO gross 2069.51/unit, net cost after SO discounts	1	\N
2	2026-05-07	2026-05-07	SO 1890258188	49	10.000	10.000	1903.83	\N	Received	2	URC Sales Order 1890258188; SO gross 2290/unit, net cost after SO discounts	3	\N
128	2026-07-30	2026-07-30	SO 1890273017	73	50.000	50.000	1339.50	\N	Received	2	URC Sales Order 1890273017; SO gross 1480/unit, net cost after SO discounts	1	\N
\.


--
-- Data for Name: recurring_expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recurring_expenses (id, name, category, amount, tax, shipping, fees, account_id, day_of_month, active, last_posted, version) FROM stdin;
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sale_items (id, sale_id, item_id, qty, unit_price, total_price, discount, promo) FROM stdin;
30	15	89	21.000	428.57	9000.00	0.0000	f
31	16	85	2.000	1600.00	3200.00	0.0000	f
32	16	87	3.000	2300.00	6900.00	0.0000	f
33	17	58	1.000	1110.00	1110.00	0.0000	f
34	17	50	3.000	2025.00	6075.00	0.0000	f
35	17	56	6.000	990.00	5940.00	0.0000	f
36	17	52	1.000	1730.00	1730.00	0.0000	f
37	18	49	1.000	2250.00	2250.00	0.0000	f
38	18	57	1.000	1160.00	1160.00	0.0000	f
39	18	52	10.000	1730.00	17300.00	0.0000	f
40	18	54	2.000	2080.00	4160.00	0.0000	f
41	18	55	1.000	1935.00	1935.00	0.0000	f
42	18	58	1.000	1110.00	1110.00	0.0000	f
43	19	85	9.000	1600.00	14400.00	0.0000	f
44	19	84	2.000	1900.00	3800.00	0.0000	f
45	19	87	3.000	2300.00	6900.00	0.0000	f
46	20	75	10.000	1900.00	19000.00	0.0000	f
47	21	101	10.000	570.00	5700.00	0.0000	f
48	21	102	10.000	570.00	5700.00	0.0000	f
49	22	49	5.000	2250.00	11250.00	0.0000	f
50	22	50	5.000	2010.00	10050.00	0.0000	f
51	22	55	3.000	1935.00	5805.00	0.0000	f
52	22	57	1.000	1210.00	1210.00	0.0000	f
53	22	58	1.000	1110.00	1110.00	0.0000	f
54	22	60	1.000	1125.00	1125.00	0.0000	f
55	22	62	1.000	1345.00	1345.00	0.0000	f
56	22	63	1.000	1370.00	1370.00	0.0000	f
57	23	84	2.000	1900.00	3800.00	0.0000	f
58	23	85	1.000	1600.00	1600.00	0.0000	f
59	24	85	2.000	1600.00	3200.00	0.0000	f
60	24	84	1.000	1900.00	1900.00	0.0000	f
61	24	86	1.000	1670.00	1670.00	0.0000	f
62	24	89	7.000	450.00	3150.00	0.0000	f
63	24	101	1.000	640.00	640.00	0.0000	f
64	24	102	1.000	640.00	640.00	0.0000	f
65	25	73	1.000	1475.00	1475.00	0.0000	f
66	25	74	3.000	2045.00	6135.00	0.0000	f
67	25	75	4.000	1895.00	7580.00	0.0000	f
68	25	77	2.000	1850.00	3700.00	0.0000	f
69	25	78	5.000	1975.00	9875.00	0.0000	f
70	26	55	1.000	1935.00	1935.00	0.0000	f
71	27	87	2.000	2300.00	4600.00	0.0000	f
72	28	57	2.000	1160.00	2320.00	0.0000	f
73	28	58	1.000	1060.00	1060.00	0.0000	f
74	28	55	1.000	1835.00	1835.00	0.0000	f
75	28	52	6.000	1630.00	9780.00	0.0000	f
76	29	101	4.000	570.00	2280.00	0.0000	f
77	29	102	4.000	570.00	2280.00	0.0000	f
78	30	101	72.000	190.00	13680.00	0.0000	f
79	30	102	72.000	190.00	13680.00	0.0000	f
80	31	101	6.000	190.00	1140.00	0.0000	f
81	31	102	6.000	190.00	1140.00	0.0000	f
82	32	101	36.000	190.00	6840.00	0.0000	f
83	32	102	36.000	190.00	6840.00	0.0000	f
84	33	101	60.000	190.00	11400.00	0.0000	f
85	33	102	60.000	190.00	11400.00	0.0000	f
86	34	101	6.000	190.00	1140.00	0.0000	f
87	34	102	6.000	190.00	1140.00	0.0000	f
88	34	89	2.000	450.00	900.00	0.0000	f
89	34	85	1.000	1600.00	1600.00	0.0000	f
90	35	74	2.000	2045.00	4090.00	0.0000	f
91	35	49	1.000	2250.00	2250.00	0.0000	f
92	35	50	1.000	2010.00	2010.00	0.0000	f
93	35	52	3.000	1730.00	5190.00	0.0000	f
94	35	54	1.000	2080.00	2080.00	0.0000	f
95	35	57	1.000	1210.00	1210.00	0.0000	f
96	35	58	1.000	1110.00	1110.00	0.0000	f
97	35	61	1.000	1045.00	1045.00	0.0000	f
98	35	62	1.000	1345.00	1345.00	0.0000	f
99	35	63	1.000	1370.00	1370.00	0.0000	f
100	35	86	1.000	1670.00	1670.00	0.0000	f
101	36	74	5.000	2045.00	10225.00	0.0000	f
102	36	78	5.000	1975.00	9875.00	0.0000	f
103	37	85	15.000	1600.00	24000.00	0.0000	f
104	37	84	1.000	1900.00	1900.00	0.0000	f
105	37	87	2.000	2300.00	4600.00	0.0000	f
106	38	52	13.000	1730.00	22490.00	0.0000	f
107	38	55	1.000	1935.00	1935.00	0.0000	f
108	39	85	3.000	1600.00	4800.00	0.0000	f
109	39	84	2.000	1900.00	3800.00	0.0000	f
110	39	87	3.000	2300.00	6900.00	0.0000	f
111	40	87	2.000	2300.00	4600.00	0.0000	f
112	40	85	3.000	1600.00	4800.00	0.0000	f
113	40	84	1.000	1900.00	1900.00	0.0000	f
114	40	101	1.000	640.00	640.00	0.0000	f
115	40	102	1.000	640.00	640.00	0.0000	f
116	40	56	3.000	990.00	2970.00	0.0000	f
117	41	84	1.000	1900.00	1900.00	0.0000	f
118	41	85	6.000	1600.00	9600.00	0.0000	f
119	41	86	2.000	1670.00	3340.00	0.0000	f
120	41	89	4.000	450.00	1800.00	0.0000	f
121	42	84	1.000	1900.00	1900.00	0.0000	f
122	42	85	1.000	1600.00	1600.00	0.0000	f
123	42	87	1.000	2300.00	2300.00	0.0000	f
124	42	87	5.000	615.00	3075.00	0.0000	f
125	42	101	5.000	640.00	3200.00	0.0000	f
126	42	102	3.000	640.00	1920.00	0.0000	f
127	42	103	1.000	3433.53	3433.53	0.0000	f
128	43	75	2.000	1940.00	3880.00	0.0000	f
129	43	74	5.000	2092.00	10460.00	0.0000	f
130	43	72	10.000	2065.00	20650.00	0.0000	f
131	44	61	1.000	1075.00	1075.00	0.0000	f
132	44	59	2.000	1105.00	2210.00	0.0000	f
133	44	58	2.000	1135.00	2270.00	0.0000	f
134	45	116	1.000	400.00	400.00	0.0000	f
135	45	117	2.000	350.00	700.00	0.0000	f
136	46	52	8.000	1785.00	14280.00	0.0000	f
137	47	79	3.000	1995.00	5985.00	0.0000	f
138	47	82	3.000	1840.00	5520.00	0.0000	f
139	47	75	5.000	5820.00	29100.00	0.0000	f
140	47	49	1.000	2300.00	2300.00	0.0000	f
141	47	55	1.000	1985.00	1985.00	0.0000	f
142	48	73	1.000	1500.00	1500.00	0.0000	f
143	48	79	2.000	1995.00	3990.00	0.0000	f
144	48	80	2.000	1830.00	3660.00	0.0000	f
145	48	82	2.000	1840.00	3680.00	0.0000	f
146	48	74	1.000	2092.00	2092.00	0.0000	f
147	48	50	2.000	2060.00	4120.00	0.0000	f
148	48	49	3.000	2300.00	6900.00	0.0000	f
149	48	76	2.000	1915.00	3830.00	0.0000	f
150	48	75	2.000	1940.00	3880.00	0.0000	f
151	48	72	1.000	2065.00	2065.00	0.0000	f
152	49	55	1.000	1785.00	1785.00	0.0000	f
153	50	84	1.000	1900.00	1900.00	0.0000	f
154	50	87	2.000	2300.00	4600.00	0.0000	f
155	51	49	3.000	2250.00	6750.00	0.0000	f
156	52	49	1.000	2250.00	2250.00	0.0000	f
157	52	52	2.000	1730.00	3460.00	0.0000	f
158	52	57	1.000	1210.00	1210.00	0.0000	f
159	52	58	1.000	1110.00	1110.00	0.0000	f
160	52	64	2.000	1050.00	2100.00	0.0000	f
161	52	65	2.000	1090.00	2180.00	0.0000	f
162	53	78	5.000	2020.00	10100.00	0.0000	f
163	53	74	5.000	2092.00	10460.00	0.0000	f
164	53	75	5.000	1940.00	9700.00	0.0000	f
165	54	75	1.000	1940.00	1940.00	0.0000	f
166	54	79	1.000	1995.00	1995.00	0.0000	f
167	54	80	1.000	1830.00	1830.00	0.0000	f
168	54	82	1.000	1840.00	1840.00	0.0000	f
169	54	52	2.000	1785.00	3570.00	0.0000	f
170	54	57	1.000	1245.00	1245.00	0.0000	f
171	54	58	1.000	1135.00	1135.00	0.0000	f
172	54	61	1.000	1075.00	1075.00	0.0000	f
173	54	84	5.000	1880.00	9400.00	0.0000	f
174	54	85	5.000	1580.00	7900.00	0.0000	f
175	54	86	5.000	1640.00	8200.00	0.0000	f
176	54	87	5.000	2270.00	11350.00	0.0000	f
177	55	55	1.000	1985.00	1985.00	0.0000	f
178	56	85	5.000	1600.00	8000.00	0.0000	f
179	56	84	1.000	1900.00	1900.00	0.0000	f
180	56	87	1.000	2300.00	2300.00	0.0000	f
181	57	75	5.000	1940.00	9700.00	0.0000	f
182	57	77	5.000	1900.00	9500.00	0.0000	f
183	57	79	5.000	1995.00	9975.00	0.0000	f
184	57	116	1.000	400.00	400.00	0.0000	f
185	57	117	2.000	350.00	700.00	0.0000	f
186	58	55	3.000	1985.00	5955.00	0.0000	f
187	58	61	3.000	1025.00	3075.00	0.0000	f
188	59	85	1.000	1600.00	1600.00	0.0000	f
189	59	87	1.000	2300.00	2300.00	0.0000	f
190	60	58	5.000	1135.00	5675.00	0.0000	f
191	60	50	5.000	2060.00	10300.00	0.0000	f
192	60	55	5.000	1985.00	9925.00	0.0000	f
193	61	85	2.000	1600.00	3200.00	0.0000	f
194	61	84	1.000	1900.00	1900.00	0.0000	f
195	61	87	1.000	2300.00	2300.00	0.0000	f
196	62	85	2.000	1580.00	3160.00	0.0000	f
197	62	84	2.000	1880.00	3760.00	0.0000	f
198	62	87	2.000	2270.00	4540.00	0.0000	f
199	63	75	15.000	1940.00	29100.00	0.0000	f
200	63	82	5.000	1840.00	9200.00	0.0000	f
201	64	78	10.000	2020.00	20200.00	0.0000	f
202	64	75	5.000	1940.00	9700.00	0.0000	f
203	65	79	1.000	1995.00	1995.00	0.0000	f
204	65	80	1.000	1830.00	1830.00	0.0000	f
205	65	82	1.000	1840.00	1840.00	0.0000	f
206	65	78	1.000	2020.00	2020.00	0.0000	f
207	65	74	1.000	2092.00	2092.00	0.0000	f
208	65	75	1.000	1940.00	1940.00	0.0000	f
209	65	76	1.000	1915.00	1915.00	0.0000	f
210	65	72	1.000	2065.00	2065.00	0.0000	f
211	65	52	2.000	1785.00	3570.00	0.0000	f
212	65	56	10.000	1025.00	10250.00	0.0000	f
213	65	61	1.000	1075.00	1075.00	0.0000	f
214	65	63	1.000	1405.00	1405.00	0.0000	f
215	65	101	12.000	190.00	2280.00	0.0000	f
216	65	102	12.000	190.00	2280.00	0.0000	f
217	65	103	10.000	77.00	770.00	0.0000	f
218	65	105	2.000	271.80	543.60	0.0000	f
219	65	118	10.000	380.00	3800.00	0.0000	f
220	65	119	10.000	67.00	670.00	0.0000	f
221	66	73	1.000	1500.00	1500.00	0.0000	f
222	66	79	1.000	1995.00	1995.00	0.0000	f
223	66	80	1.000	1830.00	1830.00	0.0000	f
224	66	82	1.000	1840.00	1840.00	0.0000	f
225	66	78	1.000	2020.00	2020.00	0.0000	f
226	66	74	1.000	2092.00	2092.00	0.0000	f
227	66	75	1.000	1940.00	1940.00	0.0000	f
228	66	76	1.000	1915.00	1915.00	0.0000	f
229	67	79	1.000	1995.00	1995.00	0.0000	f
230	67	80	1.000	1830.00	1830.00	0.0000	f
231	67	82	1.000	1840.00	1840.00	0.0000	f
232	67	78	1.000	2020.00	2020.00	0.0000	f
233	67	75	1.000	1940.00	1940.00	0.0000	f
234	67	76	1.000	1915.00	1915.00	0.0000	f
235	67	72	1.000	2065.00	2065.00	0.0000	f
236	67	74	1.000	2092.00	2092.00	0.0000	f
237	67	114	1.000	1331.16	1331.16	0.0000	f
238	67	118	10.000	380.46	3804.60	0.0000	f
239	67	101	12.000	190.00	2280.00	0.0000	f
240	67	102	12.000	190.00	2280.00	0.0000	f
241	67	105	1.000	271.80	271.80	0.0000	f
242	68	79	1.000	1995.00	1995.00	0.0000	f
243	68	80	1.000	1830.00	1830.00	0.0000	f
244	68	82	1.000	1840.00	1840.00	0.0000	f
245	68	49	1.000	2300.00	2300.00	0.0000	f
246	68	50	1.000	2060.00	2060.00	0.0000	f
247	68	51	1.000	2040.00	2040.00	0.0000	f
248	68	52	3.000	1785.00	5355.00	0.0000	f
249	68	54	1.000	2125.00	2125.00	0.0000	f
250	68	56	2.000	1025.00	2050.00	0.0000	f
251	68	61	1.000	1075.00	1075.00	0.0000	f
252	68	63	1.000	1405.00	1405.00	0.0000	f
253	68	62	1.000	1380.00	1380.00	0.0000	f
254	68	101	12.000	190.00	2280.00	0.0000	f
255	68	102	12.000	190.00	2280.00	0.0000	f
256	68	105	2.000	271.80	543.60	0.0000	f
257	68	106	10.000	160.33	1603.30	0.0000	f
258	68	103	10.000	77.00	770.00	0.0000	f
259	68	116	6.000	414.56	2487.36	0.0000	f
260	69	65	1.000	1120.00	1120.00	0.0000	f
261	69	64	1.000	1080.00	1080.00	0.0000	f
262	70	88	5.000	450.00	2250.00	0.0000	f
263	70	89	5.000	470.00	2350.00	0.0000	f
264	70	51	1.000	2040.00	2040.00	0.0000	f
265	70	49	1.000	2300.00	2300.00	0.0000	f
266	71	55	1.000	1985.00	1985.00	0.0000	f
267	72	85	2.000	0.00	0.00	0.0000	f
268	72	87	1.000	0.00	0.00	0.0000	f
269	72	106	12.000	0.00	0.00	0.0000	f
270	72	105	1.000	0.00	0.00	0.0000	f
271	72	103	6.000	0.00	0.00	0.0000	f
272	73	84	15.000	1880.00	28200.00	0.0000	f
273	73	85	20.000	1580.00	31600.00	0.0000	f
274	74	52	4.000	1785.00	7140.00	0.0000	f
275	74	54	1.000	2125.00	2125.00	0.0000	f
276	74	50	2.000	2060.00	4120.00	0.0000	f
277	74	51	1.000	2040.00	2040.00	0.0000	f
278	75	49	2.000	2300.00	4600.00	0.0000	f
279	75	50	5.000	2060.00	10300.00	0.0000	f
280	75	51	3.000	2040.00	6120.00	0.0000	f
281	75	55	2.000	1985.00	3970.00	0.0000	f
282	75	61	2.000	1075.00	2150.00	0.0000	f
283	75	63	2.000	1405.00	2810.00	0.0000	f
284	75	101	12.000	190.00	2280.00	0.0000	f
285	75	101	12.000	190.00	2280.00	0.0000	f
286	76	85	1.000	1580.00	1580.00	0.0000	f
287	76	84	1.000	1880.00	1880.00	0.0000	f
288	76	52	3.000	1785.00	5355.00	0.0000	f
289	76	73	1.000	1500.00	1500.00	0.0000	f
290	76	74	1.000	2092.00	2092.00	0.0000	f
291	76	78	1.000	2020.00	2020.00	0.0000	f
292	76	76	1.000	1915.00	1915.00	0.0000	f
293	76	75	1.000	1940.00	1940.00	0.0000	f
294	76	79	1.000	1995.00	1995.00	0.0000	f
295	76	82	1.000	1840.00	1840.00	0.0000	f
296	76	80	1.000	1830.00	1830.00	0.0000	f
297	76	49	1.000	2300.00	2300.00	0.0000	f
298	76	50	2.000	2060.00	4120.00	0.0000	f
299	76	55	1.000	1985.00	1985.00	0.0000	f
300	76	61	1.000	1075.00	1075.00	0.0000	f
301	76	51	1.000	2040.00	2040.00	0.0000	f
302	76	57	1.000	1245.00	1245.00	0.0000	f
303	76	59	1.000	1105.00	1105.00	0.0000	f
304	76	63	1.000	1405.00	1405.00	0.0000	f
305	76	62	1.000	1380.00	1380.00	0.0000	f
306	76	60	1.000	1160.00	1160.00	0.0000	f
307	77	87	20.000	2270.00	45400.00	0.0000	f
308	78	85	1.000	1580.00	1580.00	0.0000	f
309	78	49	1.000	2300.00	2300.00	0.0000	f
310	78	50	1.000	2060.00	2060.00	0.0000	f
311	78	51	10.000	2040.00	20400.00	0.0000	f
312	78	52	1.000	1785.00	1785.00	0.0000	f
313	78	54	1.000	2125.00	2125.00	0.0000	f
314	78	56	1.000	1025.00	1025.00	0.0000	f
315	78	61	1.000	1075.00	1075.00	0.0000	f
316	78	63	1.000	1405.00	1405.00	0.0000	f
317	78	62	1.000	1380.00	1380.00	0.0000	f
318	78	57	1.000	1245.00	1245.00	0.0000	f
319	78	60	1.000	1160.00	1160.00	0.0000	f
320	78	59	1.000	1105.00	1105.00	0.0000	f
321	79	89	6.000	470.00	2820.00	0.0000	f
322	79	90	21.000	630.00	13230.00	0.0000	f
323	79	102	11.000	190.00	2090.00	0.0000	f
324	79	101	11.000	190.00	2090.00	0.0000	f
325	80	85	3.000	1600.00	4800.00	0.0000	f
326	80	87	1.000	2300.00	2300.00	0.0000	f
327	81	101	6.000	158.33	950.00	0.0000	f
328	81	102	5.000	190.00	950.00	0.0000	f
329	81	85	1.000	1600.00	1600.00	0.0000	f
330	81	86	1.000	1640.00	1640.00	0.0000	f
331	82	101	10.000	190.00	1900.00	0.0000	f
332	82	102	10.000	190.00	1900.00	0.0000	f
333	82	105	1.000	270.00	270.00	0.0000	f
334	82	103	2.000	67.00	134.00	0.0000	f
335	83	85	3.000	1580.00	4740.00	0.0000	f
336	84	58	5.000	1049.00	5245.00	0.0000	f
337	84	55	2.000	1885.00	3770.00	0.0000	f
338	84	50	5.000	1960.00	9800.00	0.0000	f
339	84	52	5.000	1685.00	8425.00	0.0000	f
340	85	52	10.000	1785.00	17850.00	0.0000	f
341	85	50	1.000	2060.00	2060.00	0.0000	f
342	85	85	1.000	1430.00	1430.00	0.0000	f
343	86	85	5.000	1430.00	7150.00	0.0000	f
344	86	86	2.000	1540.00	3080.00	0.0000	f
345	86	87	2.000	2170.00	4340.00	0.0000	f
346	86	50	4.000	2060.00	8240.00	0.0000	f
347	86	58	1.000	1135.00	1135.00	0.0000	f
348	86	52	5.000	1785.00	8925.00	0.0000	f
349	86	55	3.000	1985.00	5955.00	0.0000	f
350	86	56	3.000	1025.00	3075.00	0.0000	f
351	87	87	2.000	2270.00	4540.00	0.0000	f
352	88	57	1.000	1245.00	1245.00	0.0000	f
353	88	58	1.000	1135.00	1135.00	0.0000	f
354	88	63	1.000	1405.00	1405.00	0.0000	f
355	89	49	1.000	2300.00	2300.00	0.0000	f
356	89	50	1.000	2060.00	2060.00	0.0000	f
357	89	51	1.000	2040.00	2040.00	0.0000	f
358	89	52	1.000	1785.00	1785.00	0.0000	f
359	89	55	1.000	1985.00	1985.00	0.0000	f
360	89	57	1.000	1245.00	1245.00	0.0000	f
361	89	58	1.000	1135.00	1135.00	0.0000	f
362	89	61	1.000	1075.00	1075.00	0.0000	f
363	89	59	1.000	1105.00	1105.00	0.0000	f
364	89	62	1.000	1380.00	1380.00	0.0000	f
365	89	63	1.000	1405.00	1405.00	0.0000	f
366	89	65	1.000	1120.00	1120.00	0.0000	f
367	90	85	3.000	1430.00	4290.00	0.0000	f
368	90	87	1.000	2270.00	2270.00	0.0000	f
369	91	74	5.000	2060.00	10300.00	0.0000	f
370	91	75	7.000	1900.00	13300.00	0.0000	f
371	91	82	12.000	1800.00	21600.00	0.0000	f
372	91	78	4.000	1990.00	7960.00	0.0000	f
373	91	73	3.000	1500.00	4500.00	0.0000	f
374	91	66	2.000	2360.00	4720.00	0.0000	f
375	91	76	2.000	1870.00	3740.00	0.0000	f
376	91	77	2.000	1860.00	3720.00	0.0000	f
377	91	52	1.000	1730.00	1730.00	0.0000	f
378	92	63	2.000	1370.00	2740.00	0.0000	f
379	92	50	4.000	2010.00	8040.00	0.0000	f
380	93	78	10.000	1975.00	19750.00	0.0000	f
381	93	82	8.000	1795.00	14360.00	0.0000	f
382	93	74	8.000	2045.00	16360.00	0.0000	f
383	93	75	10.000	1895.00	18950.00	0.0000	f
384	93	73	4.000	1475.00	5900.00	0.0000	f
385	93	77	5.000	1850.00	9250.00	0.0000	f
386	94	57	1.000	1210.00	1210.00	0.0000	f
387	95	75	9.000	1900.00	17100.00	0.0000	f
388	95	73	2.000	1500.00	3000.00	0.0000	f
469	96	73	1.000	1500.00	1500.00	0.0000	f
470	96	74	1.000	2092.00	2092.00	0.0000	f
471	96	75	1.000	1940.00	1940.00	0.0000	f
472	96	76	1.000	1915.00	1915.00	0.0000	f
473	96	82	1.000	1840.00	1840.00	0.0000	f
474	96	83	1.000	1970.00	1970.00	0.0000	f
475	96	79	1.000	1995.00	1995.00	0.0000	f
476	96	80	1.000	1830.00	1830.00	0.0000	f
477	96	49	1.000	2300.00	2300.00	0.0000	f
478	96	50	1.000	2060.00	2060.00	0.0000	f
479	96	51	1.000	2040.00	2040.00	0.0000	f
480	96	52	1.000	1785.00	1785.00	0.0000	f
481	96	54	1.000	2125.00	2125.00	0.0000	f
482	96	55	1.000	1985.00	1985.00	0.0000	f
483	96	85	2.000	1580.00	3160.00	0.0000	f
484	96	84	2.000	1880.00	3760.00	0.0000	f
485	96	87	1.000	2270.00	2270.00	0.0000	f
486	96	116	1.000	427.20	363.12	64.0800	f
487	96	114	10.000	110.19	936.60	16.5300	f
488	96	113	1.000	393.78	334.71	59.0700	f
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales (id, sales_no, date, customer, store_farm, term, due_date, contact_no, payment_mode, account_id, sales_rep_id, subtotal, tax_pct, tax_amount, discount_pct, discount, total, amount_paid, status, customer_id, version) FROM stdin;
28	ML-014	2026-05-26	2NK Agrivet	San Vicente, Butuan City	\N	\N	\N	\N	\N	\N	14995.00	0.000	0.00	0.000	0.00	14995.00	14995.00	Completed	3	1
77	ML-063	2026-07-09	JPT Rice and Feeds Retailing	Butuan City	\N	\N	\N	\N	\N	\N	45400.00	0.000	0.00	0.000	2000.00	43400.00	43400.00	Completed	26	1
21	ML-007	2026-05-20	Po Tropical	Butuan City	\N	\N	\N	\N	\N	\N	11400.00	0.000	0.00	0.000	400.00	11000.00	11000.00	Completed	34	1
22	ML-008	2026-05-20	Dhudz Nangcas	Las Nieves	\N	\N	\N	\N	\N	\N	33265.00	0.000	0.00	0.000	1550.00	31715.00	31715.00	Completed	9	1
50	ML-036	2026-06-20	Urban Paws	Butuan City	\N	\N	\N	\N	\N	\N	6500.00	0.000	0.00	0.000	300.00	6200.00	6200.00	Completed	37	1
49	ML-035	2026-06-17	Jojie Maramara	Butuan City	\N	\N	\N	\N	\N	\N	1785.00	0.000	0.00	0.000	0.00	1785.00	1785.00	Completed	25	1
48	ML-034	2026-06-17	Janelle Kyle Agri Trading	Butuan City	\N	\N	\N	\N	\N	\N	35717.00	0.000	0.00	0.000	1400.00	30437.00	30437.00	Completed	18	1
47	ML-033	2026-06-16	Jessie Jhon Malias	RTR, Ag Nor	\N	\N	\N	\N	\N	\N	44890.00	0.000	0.00	0.000	1840.00	43050.00	43050.00	Completed	20	1
46	ML-032	2026-06-16	2NK Agrivet	San Vicente, Butuan City	\N	\N	\N	\N	\N	\N	14280.00	0.000	0.00	0.000	800.00	13480.00	13480.00	Completed	3	1
45	ML-031	2026-06-16	Divine Mercy Adorable	Los Angeles, Butuan City	\N	\N	\N	\N	\N	\N	1100.00	0.000	0.00	0.000	0.00	1100.00	1100.00	Completed	10	1
44	ML-030	2026-06-08	Ian Kenneth Varela	\N	\N	\N	\N	\N	\N	\N	5555.00	0.000	0.00	0.000	200.00	5355.00	5355.00	Completed	17	1
43	ML-029	2026-06-08	Divine Mercy Adorable	Los Angeles, Butuan City	\N	\N	\N	\N	\N	\N	34990.00	0.000	0.00	0.000	850.00	34140.00	34140.00	Completed	10	1
40	ML-026	2026-06-04	Golden Sunrise Agrivet	RTR, Ag Nor	\N	\N	\N	\N	\N	\N	15550.00	0.000	0.00	0.000	860.00	14690.00	14690.00	Completed	14	1
38	ML-024	2026-06-04	Janelle Kyle Agri Trading	Butuan City	\N	\N	\N	\N	\N	\N	24425.00	0.000	0.00	0.000	1120.00	23205.00	23205.00	Completed	18	1
37	ML-023	2026-06-04	Urban Paws	Butuan City	\N	\N	\N	\N	\N	\N	30500.00	0.000	0.00	0.000	1800.00	28700.00	28700.00	Completed	37	1
36	ML-022	2026-06-01	Divine Mercy Adorable	Los Angeles, Butuan City	\N	\N	\N	\N	\N	\N	20100.00	0.000	0.00	0.000	500.00	19600.00	19600.00	Completed	10	1
35	ML-021	2026-05-28	Janelle Kyle Agri Trading	Butuan City	\N	\N	\N	\N	\N	\N	23370.00	0.000	0.00	0.000	940.00	22430.00	22430.00	Completed	18	1
34	ML-020	2026-05-28	PLK Pet Shop	Villakananga, Butuan City	\N	\N	\N	\N	\N	\N	4780.00	0.000	0.00	0.000	150.00	4630.00	4630.00	Completed	32	1
32	ML-018	2026-05-28	Alphadog	Butuan City	\N	\N	\N	\N	\N	\N	13680.00	0.000	0.00	0.000	0.00	13680.00	13680.00	Completed	6	1
75	ML-061	2026-07-08	Janelle Kyle Agri Trading	Butuan City	Credit	\N	\N	\N	\N	\N	34510.00	0.000	0.00	0.000	2120.00	32390.00	0.00	Completed	18	1
31	ML-017	2026-05-28	Po Tropical	Butuan City	\N	\N	\N	\N	\N	\N	2280.00	0.000	0.00	0.000	0.00	2280.00	2280.00	Completed	34	1
30	ML-016	2026-05-28	Po Tropical	Butuan City	\N	\N	\N	\N	\N	\N	27360.00	0.000	0.00	0.000	0.00	27360.00	27360.00	Completed	34	1
29	ML-015	2026-05-26	WRM Agrivet & Pet Shop	Surigao City	\N	\N	\N	\N	\N	\N	4560.00	0.000	0.00	0.000	0.00	4560.00	4560.00	Completed	39	1
33	ML-019	2026-05-28	Mazaua Pet Shop	Butuan City	Credit	\N	\N	\N	\N	\N	22800.00	0.000	0.00	0.000	0.00	22800.00	0.00	Completed	29	1
39	ML-025	2026-06-04	Mazaua Pet Shop	Butuan City	Credit	\N	\N	\N	\N	\N	15500.00	0.000	0.00	0.000	800.00	14700.00	0.00	Completed	29	1
41	ML-027	2026-06-04	Furtastic Pet Care Services	Cabadbaran City	Credit	\N	\N	\N	\N	\N	16640.00	0.000	0.00	0.000	1000.00	15640.00	0.00	Completed	13	1
42	ML-028	2026-06-04	The Hobby Company Pet Shop	Buenavista, Ag Nor	Credit	\N	\N	\N	\N	\N	17428.53	0.000	0.00	0.000	1800.03	15628.50	0.00	Completed	35	1
76	ML-062	2026-07-09	Gorgonio Agrivet	Maug, Butuan City	Credit	\N	\N	\N	\N	\N	41762.00	0.000	0.00	0.000	1920.00	39842.00	0.00	Completed	15	1
23	ML-009	2026-05-22	Johnny Porras	Davao City	\N	\N	\N	\N	\N	\N	5400.00	0.000	0.00	0.000	300.00	5100.00	5100.00	Completed	23	1
27	ML-013	2026-05-26	Dream Feeders Agrivet	Tiniwisan, Butuan City	\N	\N	\N	\N	\N	\N	4600.00	0.000	0.00	0.000	240.00	4360.00	4360.00	Completed	11	1
26	ML-012	2026-05-25	Jojie Maramara	Butuan City	\N	\N	\N	\N	\N	\N	1935.00	0.000	0.00	0.000	80.00	1855.00	1855.00	Completed	25	1
25	ML-011	2026-05-25	Divine Mercy Adorable	Los Angeles, Butuan City	\N	\N	\N	\N	\N	\N	28765.00	0.000	0.00	0.000	750.00	28015.00	28015.00	Completed	10	1
24	ML-010	2026-05-23	The Hobby Company Pet Shop	Buenavista, Ag Nor	\N	\N	\N	\N	\N	\N	11200.00	0.000	0.00	0.000	715.00	10485.00	10485.00	Completed	35	1
19	ML-005	2026-05-16	Urban Paws	Butuan City	\N	\N	\N	\N	\N	\N	25100.00	0.000	0.00	0.000	1400.00	23700.00	23700.00	Completed	37	1
18	ML-004	2026-05-16	2NK	San Vicente, Butuan City	\N	\N	\N	\N	\N	\N	27915.00	0.000	0.00	0.000	1650.00	26265.00	26265.00	Completed	2	1
20	ML-006	2026-05-15	John Ford Magtagad	\N	\N	\N	\N	\N	\N	\N	19000.00	0.000	0.00	0.000	1000.00	18000.00	18000.00	Completed	22	1
17	ML-003	2026-05-14	Johnped Diacor	\N	\N	\N	\N	\N	\N	\N	14855.00	0.000	0.00	0.000	600.00	14255.00	14255.00	Completed	24	1
16	ML-002	2026-05-14	NP Intino	Ampayon, Butuan City	\N	\N	\N	\N	\N	\N	10100.00	0.000	0.00	0.000	450.00	9650.00	9650.00	Completed	30	1
15	ML-001	2026-05-14	Alben Macabuhay	Villakananga, Butuan City	\N	\N	\N	\N	\N	\N	9000.00	0.000	0.00	0.000	900.00	8100.00	8100.00	Completed	5	1
62	ML-048	2026-07-04	NP Intino	Ampayon, Butuan City	Credit	\N	\N	\N	\N	\N	11460.00	0.000	0.00	0.000	720.00	10740.00	0.00	Completed	30	1
63	ML-049	2026-07-04	Jessie Jhon Malias	RTR, Ag Nor	Credit	\N	\N	\N	\N	\N	38300.00	0.000	0.00	0.000	1600.00	36700.00	0.00	Completed	20	1
65	ML-051	2026-07-06	Madat Agrivet	Buenavista, Ag Nor	Credit	\N	\N	\N	\N	\N	42340.60	0.000	0.00	0.000	2790.00	39550.00	0.00	Completed	28	1
66	ML-052	2026-07-06	Obud Store	Buenavista, Ag Nor	Credit	\N	\N	\N	\N	\N	15132.00	0.000	0.00	0.000	600.00	14532.00	0.00	Completed	31	1
67	ML-053	2026-07-06	Tomba Store	Nasipit, Ag Nor	Credit	\N	\N	\N	\N	\N	25664.56	0.000	0.00	0.000	2150.00	23514.56	0.00	Completed	36	1
68	ML-054	2026-07-06	M&N Agrivet	Nasipit, Ag Nor	Credit	\N	\N	\N	\N	\N	35419.26	0.000	0.00	0.000	2210.00	33209.26	0.00	Completed	27	1
69	ML-055	2026-07-06	Tomba Store	Nasipit, Ag Nor	Credit	\N	\N	\N	\N	\N	2200.00	0.000	0.00	0.000	80.00	2120.00	0.00	Completed	36	1
70	ML-056	2026-07-07	WRM	Surigao City	Credit	\N	\N	\N	\N	\N	8940.00	0.000	0.00	0.000	410.00	8530.00	0.00	Completed	38	1
71	ML-057	2026-07-07	Jojie Maramara	Butuan City	Credit	\N	\N	\N	\N	\N	1985.00	0.000	0.00	0.000	80.00	1905.00	0.00	Completed	25	1
74	ML-060	2026-07-07	Jessie Lua	Butuan City	Credit	\N	\N	\N	\N	\N	15425.00	0.000	0.00	0.000	480.00	14945.00	0.00	Completed	21	1
78	ML-064	2026-07-10	ACM Agrivet	Libertad, Butuan City	Credit	\N	\N	\N	\N	\N	38645.00	0.000	0.00	0.000	1600.00	37045.00	0.00	Completed	4	1
79	ML-065	2026-07-10	WRM	Surigao City	Credit	\N	\N	\N	\N	\N	20230.00	0.000	0.00	0.000	675.00	19555.00	0.00	Completed	38	1
81	ML-067	2026-07-11	WRM	Surigao City	Credit	\N	\N	\N	\N	\N	5140.00	0.000	0.00	0.000	200.00	4940.00	0.00	Completed	38	1
82	ML-068	2026-07-13	PLK Petshop	Villakananga, Butuan City	Credit	\N	\N	\N	\N	\N	4204.00	0.000	0.00	0.000	0.00	4224.00	0.00	Completed	33	1
84	ML-070	2026-07-16	2NK Agrivet	San Vicente, Butuan City	Credit	\N	\N	\N	\N	\N	27240.00	0.000	0.00	0.000	0.00	27420.00	0.00	Completed	3	1
86	ML-072	2026-07-17	Janelle Kyle Agri Trading	Butuan City	Credit	\N	\N	\N	\N	\N	41900.00	0.000	0.00	0.000	1120.00	40780.00	0.00	Completed	18	1
88	ML-074	2026-07-18	Azote Store	Butuan City	Credit	\N	\N	\N	\N	\N	3785.00	0.000	0.00	0.000	120.00	3665.00	0.00	Completed	7	1
89	ML-075	2026-07-20	0919 Agrivet	Butuan City	Credit	\N	\N	\N	\N	\N	18635.00	0.000	0.00	0.000	680.00	17955.00	0.00	Completed	1	1
96	ML-082	2026-07-31	Greenfield Agrivet Supply	Cubi-cubi District West, National Highway, Nasipit (Marites Selim)	15 days	2026-08-15	09338588310	\N	\N	\N	38489.88	0.000	0.00	0.000	288.45	38201.43	0.00	Completed	16	4
87	ML-073	2026-07-17	Urban Paws	Butuan City	Credit	\N	\N	\N	\N	\N	4540.00	0.000	0.00	0.000	200.00	4340.00	4340.00	Completed	37	1
90	ML-076	2026-07-20	Urban Paws	Butuan City	Credit	\N	\N	\N	\N	\N	6560.00	0.000	0.00	0.000	100.00	6460.00	6460.00	Completed	37	1
73	ML-059	2026-07-07	JPT Rice and Feeds Retailing	Butuan City	\N	\N	\N	\N	\N	\N	59800.00	0.000	0.00	0.000	3500.00	56300.00	56300.00	Completed	26	1
60	ML-046	2026-07-03	2NK Agrivet	San Vicente, Butuan City	\N	\N	\N	\N	\N	\N	25900.00	0.000	0.00	0.000	1400.00	24500.00	24500.00	Completed	3	1
85	ML-071	2026-07-17	Dan Beros	Nasipit, Ag Nor	\N	\N	\N	\N	\N	\N	21340.00	0.000	0.00	0.000	1210.00	20130.00	20130.00	Completed	8	1
83	ML-069	2026-07-15	Urban Paws	Butuan City	\N	\N	\N	\N	\N	\N	4740.00	0.000	0.00	0.000	300.00	4440.00	4440.00	Completed	37	1
80	ML-066	2026-07-11	Urban Paws	Butuan City	\N	\N	\N	\N	\N	\N	7100.00	0.000	0.00	0.000	400.00	6700.00	6700.00	Completed	37	1
72	ML-058	2026-07-07	Urban Paws	Butuan City	\N	\N	\N	\N	\N	\N	8152.00	0.000	0.00	0.000	300.00	7852.00	7852.00	Completed	37	1
64	ML-050	2026-07-04	Divine Mercy Adorable	Los Angeles, Butuan City	\N	\N	\N	\N	\N	\N	29900.00	0.000	0.00	0.000	750.00	29150.00	29150.00	Completed	10	1
61	ML-047	2026-07-03	Urban Paws	Butuan City	\N	\N	\N	\N	\N	\N	7400.00	0.000	0.00	0.000	400.00	7000.00	7000.00	Completed	37	1
59	ML-045	2026-06-30	Urban Paws	Butuan City	\N	\N	\N	\N	\N	\N	3900.00	0.000	0.00	0.000	200.00	3700.00	3700.00	Completed	37	1
58	ML-044	2026-06-30	2NK Agrivet	San Vicente, Butuan City	\N	\N	\N	\N	\N	\N	9030.00	0.000	0.00	0.000	450.00	8580.00	8580.00	Completed	3	1
57	ML-043	2026-06-29	Divine Mercy Adorable	Los Angeles, Butuan City	\N	\N	\N	\N	\N	\N	30275.00	0.000	0.00	0.000	750.00	29525.00	29525.00	Completed	10	1
56	ML-042	2026-06-26	Urban Paws	Butuan City	\N	\N	\N	\N	\N	\N	12200.00	0.000	0.00	0.000	700.00	11500.00	11500.00	Completed	37	1
55	ML-041	2026-06-24	JPT Rice and Feeds Retailing	Butuan City	\N	\N	\N	\N	\N	\N	1985.00	0.000	0.00	0.000	80.00	1905.00	1905.00	Completed	26	1
54	ML-040	2026-06-24	JPT Rice and Feeds Retailing	Butuan City	\N	\N	\N	\N	\N	\N	51480.00	0.000	0.00	0.000	2600.00	48880.00	48880.00	Completed	26	1
53	ML-039	2026-06-20	Divine Mercy Adorable	Los Angeles, Butuan City	\N	\N	\N	\N	\N	\N	30260.00	0.000	0.00	0.000	750.00	29510.00	29510.00	Completed	10	1
52	ML-038	2026-06-20	2NK Agrivet	San Vicente, Butuan City	\N	\N	\N	\N	\N	\N	12310.00	0.000	0.00	0.000	1040.00	11290.00	11290.00	Completed	3	1
51	ML-037	2026-06-20	Janelle Kyle Agri Trading	Butuan City	\N	\N	\N	\N	\N	\N	6750.00	0.000	0.00	0.000	300.00	6450.00	6450.00	Completed	18	1
92	ML-078	2026-05-20	Fegen Gines	Butuan City	\N	\N	\N	\N	\N	\N	10780.00	0.000	0.00	0.000	400.00	10380.00	10380.00	Completed	12	1
95	ML-081	2026-05-26	Jerome Racaza	La Union, Cabadbaran City	\N	\N	\N	\N	\N	\N	20100.00	0.000	0.00	0.000	1000.00	19100.00	19100.00	Completed	19	1
94	ML-080	2026-05-22	Fegen Gines	Butuan City	\N	\N	\N	\N	\N	\N	1210.00	0.000	0.00	0.000	50.00	1160.00	1160.00	Completed	12	1
93	ML-079	2026-05-22	Jerome Racaza	La Union, Cabadbaran City	\N	\N	\N	\N	\N	\N	84570.00	0.000	0.00	0.000	4300.00	80270.00	80270.00	Completed	19	1
91	ML-077	2026-05-15	Jerome Racaza	La Union, Cabadbaran City	\N	\N	\N	\N	\N	\N	71570.00	0.000	0.00	0.000	3550.00	68020.00	68020.00	Completed	19	1
\.


--
-- Data for Name: sales_reps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_reps (id, name, commission_rate, version) FROM stdin;
3	Romel Nabong	0.0000	1
4	Henry Benjamin Cuyuca	0.0000	1
5	Katherine May Cuyuca	0.0000	1
6	Johnny Porras	0.0000	1
7	Fegen Gines	0.0000	1
8	Marvin Lacano	0.0000	1
9	Renante Mahinay	0.0000	1
10	Eric Putchidio	0.0000	1
11	John Ford Magtagad	0.0000	1
12	Al Oclarit	0.0000	1
13	Glomer Celestino	0.0000	1
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settings (key, value) FROM stdin;
currency_symbol	₱
dr_company	ELISHEN AGRIVANCE ANIMAL FEEDS PRODUCT WHOLESALING
dr_proprietor	Proprietor: HENRY BENJAMIN B. CUYUCA
dr_tin	NonVAT Reg. TIN 464-130-183-00000
dr_address	Unit 1 & 2 KR Minishop, Greenpatch Block 45, Democrito Plaza Avenue, Alviola Village, Baan Km 3 8600 Butuan City, Agusan del Norte, Philippines
\.


--
-- Data for Name: store_visits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.store_visits (id, user_name, store_name, ts, lat, lng, accuracy, photo, q_order, q_products, q_remarks, version) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, roles, pin, active, version, daily_rate) FROM stdin;
4	Johnny Porras	Admin, Area Manager	1234	t	1	0.00
7	Marvin Lacano	K-tech	1234	t	1	0.00
9	Eric Putchidio	Warehouse In-charge	1234	t	1	0.00
10	John Ford Magtagad	Marketing	1234	t	1	0.00
11	Al Oclarit	Marketing	1234	t	1	0.00
1	Glomer Celestino	Admin	1234	t	1	0.00
5	Romel Nabong	Sales Representative	1234	t	1	0.00
6	Fegen Gines	K-tech	1234	t	1	0.00
8	Renante Mahinay	Warehouse In-charge	1234	t	1	0.00
2	Henry Benjamin Cuyuca	Admin, Owner	1234	t	1	0.00
3	Katherine May Cuyuca	Admin, Owner	1234	t	1	0.00
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendors (id, name, contact_name, phone, email, address, country, notes, version) FROM stdin;
2	Universal Robina Corporation	\N	\N	\N	Tera Tower Bridgetowne, E. Rodriguez Jr. Avenue (C5 Road), Ugong Norte, Quezon City	\N	URC / Robina Agri Partners — feeds, RobiChem, pet food supplier	1
\.


--
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accounts_id_seq', 8, true);


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attendance_id_seq', 15, true);


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 117, true);


--
-- Name: balance_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.balance_entries_id_seq', 2, true);


--
-- Name: bom_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bom_lines_id_seq', 1, true);


--
-- Name: claims_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.claims_id_seq', 2, true);


--
-- Name: customer_advances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_advances_id_seq', 2, true);


--
-- Name: customer_tiers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_tiers_id_seq', 39, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 40, true);


--
-- Name: deliveries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.deliveries_id_seq', 80, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expenses_id_seq', 9, true);


--
-- Name: financial_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.financial_allocations_id_seq', 5, true);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.items_id_seq', 160, true);


--
-- Name: manual_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.manual_inventory_id_seq', 245, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 6, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payments_id_seq', 69, true);


--
-- Name: payroll_runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payroll_runs_id_seq', 1, true);


--
-- Name: profit_goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.profit_goals_id_seq', 1, false);


--
-- Name: purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchases_id_seq', 130, true);


--
-- Name: recurring_expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recurring_expenses_id_seq', 1, true);


--
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sale_items_id_seq', 489, true);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_id_seq', 97, true);


--
-- Name: sales_reps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_reps_id_seq', 13, true);


--
-- Name: store_visits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.store_visits_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 11, true);


--
-- Name: vendors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vendors_id_seq', 2, true);


--
-- Name: accounts accounts_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_name_key UNIQUE (name);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: balance_entries balance_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance_entries
    ADD CONSTRAINT balance_entries_pkey PRIMARY KEY (id);


--
-- Name: bom_lines bom_lines_finished_item_id_component_item_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_lines
    ADD CONSTRAINT bom_lines_finished_item_id_component_item_id_key UNIQUE (finished_item_id, component_item_id);


--
-- Name: bom_lines bom_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_lines
    ADD CONSTRAINT bom_lines_pkey PRIMARY KEY (id);


--
-- Name: claims claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_pkey PRIMARY KEY (id);


--
-- Name: customer_advances customer_advances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_advances
    ADD CONSTRAINT customer_advances_pkey PRIMARY KEY (id);


--
-- Name: customer_tiers customer_tiers_customer_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_tiers
    ADD CONSTRAINT customer_tiers_customer_key UNIQUE (customer);


--
-- Name: customer_tiers customer_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_tiers
    ADD CONSTRAINT customer_tiers_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: deliveries deliveries_dr_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_dr_no_key UNIQUE (dr_no);


--
-- Name: deliveries deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: financial_allocations financial_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_allocations
    ADD CONSTRAINT financial_allocations_pkey PRIMARY KEY (id);


--
-- Name: items items_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_name_key UNIQUE (name);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: items items_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_sku_key UNIQUE (sku);


--
-- Name: manual_inventory manual_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manual_inventory
    ADD CONSTRAINT manual_inventory_pkey PRIMARY KEY (id);


--
-- Name: notification_reads notification_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_reads
    ADD CONSTRAINT notification_reads_pkey PRIMARY KEY (user_name);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payments payments_or_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_or_no_key UNIQUE (or_no);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payroll_runs payroll_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_runs
    ADD CONSTRAINT payroll_runs_pkey PRIMARY KEY (id);


--
-- Name: profit_goals profit_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profit_goals
    ADD CONSTRAINT profit_goals_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: recurring_expenses recurring_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_pkey PRIMARY KEY (id);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: sales_reps sales_reps_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_reps
    ADD CONSTRAINT sales_reps_name_key UNIQUE (name);


--
-- Name: sales_reps sales_reps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_reps
    ADD CONSTRAINT sales_reps_pkey PRIMARY KEY (id);


--
-- Name: sales sales_sales_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_sales_no_key UNIQUE (sales_no);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- Name: store_visits store_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_visits
    ADD CONSTRAINT store_visits_pkey PRIMARY KEY (id);


--
-- Name: users users_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_name_key UNIQUE (name);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_name_key UNIQUE (name);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: customers_name_ux; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX customers_name_ux ON public.customers USING btree (upper(TRIM(BOTH FROM name)));


--
-- Name: idx_att_ts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_att_ts ON public.attendance USING btree (ts DESC);


--
-- Name: idx_audit_ts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_ts ON public.audit_log USING btree (ts DESC);


--
-- Name: idx_deliveries_sale; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deliveries_sale ON public.deliveries USING btree (sale_id);


--
-- Name: idx_expenses_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_date ON public.expenses USING btree (date);


--
-- Name: idx_payments_sale; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_sale ON public.payments USING btree (sale_id);


--
-- Name: idx_purchases_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchases_item ON public.purchases USING btree (item_id);


--
-- Name: idx_sale_items_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sale_items_item ON public.sale_items USING btree (item_id);


--
-- Name: idx_sales_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_customer ON public.sales USING btree (upper(TRIM(BOTH FROM customer)));


--
-- Name: idx_sales_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_date ON public.sales USING btree (date);


--
-- Name: balance_entries balance_entries_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance_entries
    ADD CONSTRAINT balance_entries_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: bom_lines bom_lines_component_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_lines
    ADD CONSTRAINT bom_lines_component_item_id_fkey FOREIGN KEY (component_item_id) REFERENCES public.items(id);


--
-- Name: bom_lines bom_lines_finished_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_lines
    ADD CONSTRAINT bom_lines_finished_item_id_fkey FOREIGN KEY (finished_item_id) REFERENCES public.items(id);


--
-- Name: customer_advances customer_advances_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_advances
    ADD CONSTRAINT customer_advances_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: deliveries deliveries_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- Name: expenses expenses_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: items items_preferred_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_preferred_vendor_id_fkey FOREIGN KEY (preferred_vendor_id) REFERENCES public.vendors(id);


--
-- Name: manual_inventory manual_inventory_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manual_inventory
    ADD CONSTRAINT manual_inventory_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: payments payments_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: payments payments_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- Name: purchases purchases_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: purchases purchases_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: purchases purchases_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: recurring_expenses recurring_expenses_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: sale_items sale_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: sale_items sale_items_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- Name: sales sales_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: sales sales_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: sales sales_sales_rep_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_sales_rep_id_fkey FOREIGN KEY (sales_rep_id) REFERENCES public.sales_reps(id);


--
-- PostgreSQL database dump complete
--

\unrestrict H33URt5pYasjx4wI8pWoLfoCfaNxzcJ2uubVd6KoUFqATbj0udIe2Wyr3dJHQoj

