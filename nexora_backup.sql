--
-- PostgreSQL database dump
--

\restrict V2KmBsPGb9RMBrdShrpMpVaLzeR3Nr6X8EYmTIwXUuOSod6JdskXfwQJLo41yNp

-- Dumped from database version 16.11 (Debian 16.11-1.pgdg13+1)
-- Dumped by pg_dump version 16.11 (Debian 16.11-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_sub_headquarters_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users_headquarters DROP CONSTRAINT IF EXISTS users_headquarters_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_headquarters_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users_headquarters DROP CONSTRAINT IF EXISTS users_headquarters_headquarters_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_limits DROP CONSTRAINT IF EXISTS user_limits_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sub_headquarters DROP CONSTRAINT IF EXISTS sub_headquarters_headquarter_id_fkey;
ALTER TABLE IF EXISTS ONLY public.stays_persons DROP CONSTRAINT IF EXISTS stays_persons_stay_id_fkey;
ALTER TABLE IF EXISTS ONLY public.stays_persons DROP CONSTRAINT IF EXISTS stays_persons_person_id_fkey;
ALTER TABLE IF EXISTS ONLY public.rooms DROP CONSTRAINT IF EXISTS rooms_room_types_id_fkey;
ALTER TABLE IF EXISTS ONLY public.rooms DROP CONSTRAINT IF EXISTS rooms_headquarters_id_fkey;
ALTER TABLE IF EXISTS ONLY public.rooms DROP CONSTRAINT IF EXISTS rooms_building_id_fkey;
ALTER TABLE IF EXISTS ONLY public.room_types DROP CONSTRAINT IF EXISTS room_types_headquarters_id_fkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_granted_by_fkey;
ALTER TABLE IF EXISTS ONLY public.role_limits DROP CONSTRAINT IF EXISTS role_limits_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.resources DROP CONSTRAINT IF EXISTS resources_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reserves_persons DROP CONSTRAINT IF EXISTS reserves_persons_reserve_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reserves_persons DROP CONSTRAINT IF EXISTS reserves_persons_person_id_fkey;
ALTER TABLE IF EXISTS ONLY public.persons_roles DROP CONSTRAINT IF EXISTS persons_roles_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.persons_roles DROP CONSTRAINT IF EXISTS persons_roles_person_id_fkey;
ALTER TABLE IF EXISTS ONLY public.persons DROP CONSTRAINT IF EXISTS persons_headquarters_id_fkey;
ALTER TABLE IF EXISTS ONLY public.permission_resources DROP CONSTRAINT IF EXISTS permission_resources_resource_id_fkey;
ALTER TABLE IF EXISTS ONLY public.permission_assignments DROP CONSTRAINT IF EXISTS permission_assignments_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.permission_assignments DROP CONSTRAINT IF EXISTS permission_assignments_sub_headquarters_id_fkey;
ALTER TABLE IF EXISTS ONLY public.permission_assignments DROP CONSTRAINT IF EXISTS permission_assignments_headquarters_id_fkey;
ALTER TABLE IF EXISTS ONLY public.palettes DROP CONSTRAINT IF EXISTS palettes_headquarters_id_fkey;
ALTER TABLE IF EXISTS ONLY public.palette_colors DROP CONSTRAINT IF EXISTS palette_colors_palette_id_fkey;
ALTER TABLE IF EXISTS ONLY public.buildings DROP CONSTRAINT IF EXISTS buildings_sub_headquarters_id_fkey;
ALTER TABLE IF EXISTS ONLY public.buildings DROP CONSTRAINT IF EXISTS buildings_headquarters_id_fkey;
ALTER TABLE IF EXISTS ONLY public.beds DROP CONSTRAINT IF EXISTS beds_types_bed_id_fkey;
ALTER TABLE IF EXISTS ONLY public.beds DROP CONSTRAINT IF EXISTS beds_room_id_fkey;
ALTER TABLE IF EXISTS ONLY public.beds DROP CONSTRAINT IF EXISTS beds_headquarters_id_fkey;
ALTER TABLE IF EXISTS ONLY public.beds_bed_types DROP CONSTRAINT IF EXISTS beds_bed_types_bed_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.beds_bed_types DROP CONSTRAINT IF EXISTS beds_bed_types_bed_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bed_types DROP CONSTRAINT IF EXISTS bed_types_headquarters_id_fkey;
DROP INDEX IF EXISTS public.idx_users_headquarters_hq_id;
DROP INDEX IF EXISTS public.idx_user_limits_user_id;
DROP INDEX IF EXISTS public.idx_stays_status;
DROP INDEX IF EXISTS public.idx_stays_room_id;
DROP INDEX IF EXISTS public.idx_stays_reservation_id;
DROP INDEX IF EXISTS public.idx_stays_persons_person_id;
DROP INDEX IF EXISTS public.idx_stays_hq_id;
DROP INDEX IF EXISTS public.idx_stays_dates;
DROP INDEX IF EXISTS public.idx_room_types_hq_name_active;
DROP INDEX IF EXISTS public.idx_room_tariffs_status;
DROP INDEX IF EXISTS public.idx_room_tariffs_room_id;
DROP INDEX IF EXISTS public.idx_room_tariffs_rate_id;
DROP INDEX IF EXISTS public.idx_room_tariffs_hq_id;
DROP INDEX IF EXISTS public.idx_role_permissions_role_id;
DROP INDEX IF EXISTS public.idx_role_permissions_permission_id;
DROP INDEX IF EXISTS public.idx_role_limits_role_id;
DROP INDEX IF EXISTS public.idx_reserves_state;
DROP INDEX IF EXISTS public.idx_reserves_room_id;
DROP INDEX IF EXISTS public.idx_reserves_persons_person_id;
DROP INDEX IF EXISTS public.idx_reserves_person_id;
DROP INDEX IF EXISTS public.idx_reserves_hq_id;
DROP INDEX IF EXISTS public.idx_reserves_dates;
DROP INDEX IF EXISTS public.idx_rates_subheadquarter_id;
DROP INDEX IF EXISTS public.idx_rates_status;
DROP INDEX IF EXISTS public.idx_rates_room_type_id;
DROP INDEX IF EXISTS public.idx_rates_query_lookup;
DROP INDEX IF EXISTS public.idx_rates_modality;
DROP INDEX IF EXISTS public.idx_rates_headquarter_id;
DROP INDEX IF EXISTS public.idx_persons_hq_doc_active;
DROP INDEX IF EXISTS public.idx_palettes_hq_name_active;
DROP INDEX IF EXISTS public.idx_menu_categories_order;
DROP INDEX IF EXISTS public.idx_menu_categories_hq;
DROP INDEX IF EXISTS public.idx_item_menus_category_id;
DROP INDEX IF EXISTS public.idx_item_menus_available;
DROP INDEX IF EXISTS public.idx_bed_types_hq_name_active;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users_headquarters DROP CONSTRAINT IF EXISTS users_headquarters_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.user_limits DROP CONSTRAINT IF EXISTS user_limits_pkey;
ALTER TABLE IF EXISTS ONLY public.permission_resources DROP CONSTRAINT IF EXISTS uq_permission_resources_resource_action;
ALTER TABLE IF EXISTS ONLY public.sub_headquarters DROP CONSTRAINT IF EXISTS sub_headquarters_pkey;
ALTER TABLE IF EXISTS ONLY public.sub_headquarters DROP CONSTRAINT IF EXISTS sub_headquarters_headquarter_id_name_key;
ALTER TABLE IF EXISTS ONLY public.stays DROP CONSTRAINT IF EXISTS stays_pkey;
ALTER TABLE IF EXISTS ONLY public.stays_persons DROP CONSTRAINT IF EXISTS stays_persons_pkey;
ALTER TABLE IF EXISTS ONLY public.rooms DROP CONSTRAINT IF EXISTS rooms_pkey;
ALTER TABLE IF EXISTS ONLY public.rooms DROP CONSTRAINT IF EXISTS rooms_building_id_number_key;
ALTER TABLE IF EXISTS ONLY public.room_types DROP CONSTRAINT IF EXISTS room_types_pkey;
ALTER TABLE IF EXISTS ONLY public.room_tariffs DROP CONSTRAINT IF EXISTS room_tariffs_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_name_key;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.role_limits DROP CONSTRAINT IF EXISTS role_limits_pkey;
ALTER TABLE IF EXISTS ONLY public.resources DROP CONSTRAINT IF EXISTS resources_pkey;
ALTER TABLE IF EXISTS ONLY public.reserves DROP CONSTRAINT IF EXISTS reserves_pkey;
ALTER TABLE IF EXISTS ONLY public.reserves_persons DROP CONSTRAINT IF EXISTS reserves_persons_pkey;
ALTER TABLE IF EXISTS ONLY public.rates DROP CONSTRAINT IF EXISTS rates_pkey;
ALTER TABLE IF EXISTS ONLY public.persons_roles DROP CONSTRAINT IF EXISTS persons_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.persons DROP CONSTRAINT IF EXISTS persons_pkey;
ALTER TABLE IF EXISTS ONLY public.permission_resources DROP CONSTRAINT IF EXISTS permission_resources_pkey;
ALTER TABLE IF EXISTS ONLY public.permission_assignments DROP CONSTRAINT IF EXISTS permission_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.palettes DROP CONSTRAINT IF EXISTS palettes_pkey;
ALTER TABLE IF EXISTS ONLY public.palette_colors DROP CONSTRAINT IF EXISTS palette_colors_pkey;
ALTER TABLE IF EXISTS ONLY public.modules DROP CONSTRAINT IF EXISTS modules_pkey;
ALTER TABLE IF EXISTS ONLY public.menu_categories DROP CONSTRAINT IF EXISTS menu_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.item_menus DROP CONSTRAINT IF EXISTS item_menus_pkey;
ALTER TABLE IF EXISTS ONLY public.headquarters DROP CONSTRAINT IF EXISTS headquarters_pkey;
ALTER TABLE IF EXISTS ONLY public.headquarters DROP CONSTRAINT IF EXISTS headquarters_name_key;
ALTER TABLE IF EXISTS ONLY public.buildings DROP CONSTRAINT IF EXISTS buildings_pkey;
ALTER TABLE IF EXISTS ONLY public.buildings DROP CONSTRAINT IF EXISTS buildings_headquarters_id_name_key;
ALTER TABLE IF EXISTS ONLY public.beds DROP CONSTRAINT IF EXISTS beds_room_id_etiquette_key;
ALTER TABLE IF EXISTS ONLY public.beds DROP CONSTRAINT IF EXISTS beds_pkey;
ALTER TABLE IF EXISTS ONLY public.beds_bed_types DROP CONSTRAINT IF EXISTS beds_bed_types_pkey;
ALTER TABLE IF EXISTS ONLY public.bed_types DROP CONSTRAINT IF EXISTS bed_types_pkey;
ALTER TABLE IF EXISTS public.resources ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.permission_resources ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.modules ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.users_headquarters;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_limits;
DROP TABLE IF EXISTS public.sub_headquarters;
DROP TABLE IF EXISTS public.stays_persons;
DROP TABLE IF EXISTS public.stays;
DROP TABLE IF EXISTS public.rooms;
DROP TABLE IF EXISTS public.room_types;
DROP TABLE IF EXISTS public.room_tariffs;
DROP TABLE IF EXISTS public.roles;
DROP TABLE IF EXISTS public.role_permissions;
DROP TABLE IF EXISTS public.role_limits;
DROP SEQUENCE IF EXISTS public.resources_id_seq;
DROP TABLE IF EXISTS public.resources;
DROP TABLE IF EXISTS public.reserves_persons;
DROP TABLE IF EXISTS public.reserves;
DROP TABLE IF EXISTS public.rates;
DROP TABLE IF EXISTS public.persons_roles;
DROP TABLE IF EXISTS public.persons;
DROP SEQUENCE IF EXISTS public.permission_resources_id_seq;
DROP TABLE IF EXISTS public.permission_resources;
DROP TABLE IF EXISTS public.permission_assignments;
DROP TABLE IF EXISTS public.palettes;
DROP TABLE IF EXISTS public.palette_colors;
DROP SEQUENCE IF EXISTS public.modules_id_seq;
DROP TABLE IF EXISTS public.modules;
DROP TABLE IF EXISTS public.menu_categories;
DROP TABLE IF EXISTS public.item_menus;
DROP TABLE IF EXISTS public.headquarters;
DROP TABLE IF EXISTS public.buildings;
DROP TABLE IF EXISTS public.beds_bed_types;
DROP TABLE IF EXISTS public.beds;
DROP TABLE IF EXISTS public.bed_types;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bed_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bed_types (
    id character varying(36) NOT NULL,
    name character varying(100) NOT NULL,
    capacity_people integer NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    created_by character varying(100) DEFAULT ''::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    headquarters_id character varying(36),
    updated_by character varying(100),
    deleted_by character varying(100),
    deleted_at timestamp with time zone,
    CONSTRAINT bed_types_capacity_people_check CHECK ((capacity_people > 0))
);


--
-- Name: beds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.beds (
    id character varying(36) NOT NULL,
    room_id character varying(36) NOT NULL,
    types_bed_id character varying(36) NOT NULL,
    etiquette character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_by character varying(100) DEFAULT ''::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    headquarters_id character varying(36),
    updated_by character varying(100),
    deleted_by character varying(100),
    deleted_at timestamp with time zone,
    CONSTRAINT beds_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'maintenance'::character varying, 'withdrawal'::character varying])::text[])))
);


--
-- Name: beds_bed_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.beds_bed_types (
    bed_id character varying(36) NOT NULL,
    bed_type_id character varying(36) NOT NULL
);


--
-- Name: buildings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.buildings (
    id character varying(36) NOT NULL,
    name character varying(150) NOT NULL,
    floor_number integer NOT NULL,
    headquarters_id character varying(36) NOT NULL,
    sub_headquarters_id character varying(36),
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    created_by character varying(100) DEFAULT ''::character varying NOT NULL,
    updated_by character varying(100),
    deleted_by character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT buildings_floor_number_check CHECK ((floor_number >= 1)),
    CONSTRAINT buildings_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'busy'::character varying, 'maintenance'::character varying, 'cleaning'::character varying, 'inactive'::character varying, 'occupied'::character varying])::text[])))
);


--
-- Name: headquarters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.headquarters (
    id character varying(36) NOT NULL,
    name character varying(150) NOT NULL,
    address text NOT NULL,
    city character varying(100) NOT NULL,
    phone character varying(30) DEFAULT ''::character varying NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_by character varying(100) DEFAULT ''::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by character varying(100),
    deleted_by character varying(100),
    deleted_at timestamp with time zone
);


--
-- Name: item_menus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_menus (
    id character varying(36) NOT NULL,
    category_id character varying(36) NOT NULL,
    name character varying(150) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    price numeric(12,2) NOT NULL,
    tax_percentage numeric(5,2) DEFAULT 0.0 NOT NULL,
    prep_time integer,
    is_vegetarian boolean DEFAULT false NOT NULL,
    is_vegan boolean DEFAULT false NOT NULL,
    image_url text DEFAULT ''::text NOT NULL,
    start_time character varying(15) DEFAULT ''::character varying NOT NULL,
    end_time character varying(15) DEFAULT ''::character varying NOT NULL,
    available boolean DEFAULT true NOT NULL,
    created_by character varying(100) DEFAULT ''::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT item_menus_prep_time_check CHECK (((prep_time IS NULL) OR (prep_time >= 0))),
    CONSTRAINT item_menus_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT item_menus_tax_percentage_check CHECK ((tax_percentage >= (0)::numeric))
);


--
-- Name: menu_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menu_categories (
    id character varying(36) NOT NULL,
    headquarters_id character varying(36) NOT NULL,
    sub_headquarters_id character varying(36),
    building_id character varying(36),
    name character varying(150) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    asset text DEFAULT ''::text NOT NULL,
    created_by character varying(100) DEFAULT ''::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT menu_categories_order_check CHECK (("order" >= 0))
);


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id integer NOT NULL,
    type_path text,
    type_component text,
    code text DEFAULT ''::text NOT NULL,
    sort_order smallint DEFAULT 0 NOT NULL
);


--
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.modules_id_seq OWNED BY public.modules.id;


--
-- Name: palette_colors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.palette_colors (
    palette_id character varying(36) NOT NULL,
    hex character varying(7) NOT NULL,
    name character varying(100) DEFAULT ''::character varying NOT NULL,
    "position" integer NOT NULL
);


--
-- Name: palettes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.palettes (
    id character varying(36) NOT NULL,
    name character varying(100) NOT NULL,
    is_defined boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    headquarters_id character varying(36),
    created_by character varying(100) DEFAULT 'system_bootstrap'::character varying NOT NULL,
    updated_by character varying(100),
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_by character varying(100),
    deleted_at timestamp with time zone
);


--
-- Name: permission_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permission_assignments (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    headquarters_id character varying(36) NOT NULL,
    sub_headquarters_id character varying(36),
    resource_id character varying(36),
    permission_resource_id character varying(36),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by character varying(100) DEFAULT 'system_bootstrap'::character varying NOT NULL,
    updated_by character varying(100),
    deleted_by character varying(100),
    deleted_at timestamp with time zone
);


--
-- Name: permission_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permission_resources (
    id integer NOT NULL,
    resource_id integer NOT NULL,
    permission boolean DEFAULT true NOT NULL,
    action character varying(50) DEFAULT ''::character varying NOT NULL,
    description text DEFAULT ''::text NOT NULL
);


--
-- Name: permission_resources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permission_resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permission_resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permission_resources_id_seq OWNED BY public.permission_resources.id;


--
-- Name: persons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.persons (
    id character varying(36) NOT NULL,
    document_type character varying(20) NOT NULL,
    document_number character varying(50) NOT NULL,
    name character varying(150) NOT NULL,
    phone_number character varying(30) NOT NULL,
    email character varying(150) NOT NULL,
    date_of_birth date NOT NULL,
    gender character varying(1) NOT NULL,
    nationality character varying(100) DEFAULT ''::character varying NOT NULL,
    created_by character varying(100) DEFAULT ''::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    headquarters_id character varying(36),
    updated_by character varying(100),
    deleted_by character varying(100),
    deleted_at timestamp with time zone,
    CONSTRAINT persons_document_type_check CHECK (((document_type)::text = ANY ((ARRAY['id_card'::character varying, 'national_id'::character varying, 'foreign_id'::character varying])::text[]))),
    CONSTRAINT persons_gender_check CHECK (((gender)::text = ANY ((ARRAY['M'::character varying, 'F'::character varying])::text[])))
);


--
-- Name: persons_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.persons_roles (
    person_id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL
);


--
-- Name: rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rates (
    id character varying(36) NOT NULL,
    name character varying(150) NOT NULL,
    headquarter_id character varying(36) NOT NULL,
    subheadquarter_id character varying(36),
    room_type_id character varying(36),
    modality character varying(30) NOT NULL,
    price numeric(12,2) NOT NULL,
    duration_units integer DEFAULT 1 NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    days_of_week character varying(50) DEFAULT 'all'::character varying NOT NULL,
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    created_by character varying(100) DEFAULT ''::character varying NOT NULL,
    updated_by character varying(100),
    deleted_by character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT rates_duration_units_check CHECK ((duration_units >= 1)),
    CONSTRAINT rates_modality_check CHECK (((modality)::text = ANY ((ARRAY['morning'::character varying, 'afternoon'::character varying, 'night'::character varying, 'daily'::character varying, 'weekly'::character varying, 'hourly'::character varying])::text[]))),
    CONSTRAINT rates_price_check CHECK ((price > (0)::numeric)),
    CONSTRAINT rates_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


--
-- Name: reserves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reserves (
    id character varying(36) NOT NULL,
    room_id character varying(36) DEFAULT ''::character varying,
    person_id character varying(36) DEFAULT ''::character varying,
    check_in_date timestamp with time zone NOT NULL,
    check_out_date timestamp with time zone NOT NULL,
    number_of_guests integer NOT NULL,
    state character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    total_price numeric(12,2) DEFAULT 0.00 NOT NULL,
    headquarters_id character varying(36),
    created_by character varying(100) DEFAULT ''::character varying NOT NULL,
    updated_by character varying(100),
    deleted_by character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT reserves_check CHECK ((check_out_date > check_in_date)),
    CONSTRAINT reserves_number_of_guests_check CHECK ((number_of_guests > 0)),
    CONSTRAINT reserves_state_check CHECK (((state)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'in progress'::character varying, 'completed'::character varying, 'canceled'::character varying, 'no show'::character varying])::text[]))),
    CONSTRAINT reserves_total_price_check CHECK ((total_price >= (0)::numeric))
);


--
-- Name: reserves_persons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reserves_persons (
    reserve_id character varying(36) NOT NULL,
    person_id character varying(36) NOT NULL
);


--
-- Name: resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resources (
    id integer NOT NULL,
    component text,
    name text NOT NULL,
    module_id integer NOT NULL,
    code text DEFAULT ''::text NOT NULL,
    sort_order smallint DEFAULT 0 NOT NULL,
    show_in_menu boolean DEFAULT true NOT NULL
);


--
-- Name: resources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resources_id_seq OWNED BY public.resources.id;


--
-- Name: role_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_limits (
    id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL,
    limit_key text NOT NULL,
    max_value integer NOT NULL,
    CONSTRAINT role_limits_limit_key_check CHECK ((limit_key ~ '^[a-z_]+$'::text)),
    CONSTRAINT role_limits_max_value_check CHECK ((max_value >= 0))
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL,
    permission_id character varying(36) NOT NULL,
    granted_by character varying(36),
    granted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id character varying(36) NOT NULL,
    name character varying(100) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_by character varying(100) DEFAULT 'system_bootstrap'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by character varying(100),
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_by character varying(100),
    deleted_at timestamp with time zone
);


--
-- Name: room_tariffs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_tariffs (
    id character varying(36) NOT NULL,
    room_id character varying(36) NOT NULL,
    rate_id character varying(36) NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    headquarters_id character varying(36),
    created_by character varying(100) DEFAULT ''::character varying NOT NULL,
    updated_by character varying(100),
    deleted_by character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT room_tariffs_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


--
-- Name: room_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_types (
    id character varying(36) NOT NULL,
    name character varying(100) NOT NULL,
    capacity integer NOT NULL,
    base_price numeric(12,2) NOT NULL,
    created_by character varying(100) DEFAULT ''::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    headquarters_id character varying(36),
    updated_by character varying(100),
    deleted_by character varying(100),
    deleted_at timestamp with time zone,
    CONSTRAINT room_types_base_price_check CHECK ((base_price >= (0)::numeric)),
    CONSTRAINT room_types_capacity_check CHECK ((capacity > 0))
);


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rooms (
    id character varying(36) NOT NULL,
    number character varying(50) NOT NULL,
    floor integer NOT NULL,
    room_types_id character varying(36) NOT NULL,
    building_id character varying(36) NOT NULL,
    headquarters_id character varying(36) NOT NULL,
    price_override numeric(12,2),
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    has_reception boolean DEFAULT false NOT NULL,
    created_by character varying(100) DEFAULT ''::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by character varying(100),
    deleted_by character varying(100),
    deleted_at timestamp with time zone,
    CONSTRAINT rooms_floor_check CHECK ((floor >= 0)),
    CONSTRAINT rooms_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'busy'::character varying, 'maintenance'::character varying, 'cleaning'::character varying, 'inactive'::character varying])::text[])))
);


--
-- Name: stays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stays (
    id character varying(36) NOT NULL,
    room_id character varying(36) NOT NULL,
    reservation_id character varying(36) DEFAULT ''::character varying,
    check_in_date timestamp with time zone NOT NULL,
    check_out_date timestamp with time zone NOT NULL,
    payment_method character varying(30) NOT NULL,
    security_deposit numeric(12,2) DEFAULT 0.00 NOT NULL,
    remarks text DEFAULT ''::text NOT NULL,
    status character varying(30) DEFAULT 'progress'::character varying NOT NULL,
    headquarters_id character varying(36),
    created_by character varying(100) DEFAULT ''::character varying NOT NULL,
    updated_by character varying(100),
    deleted_by character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT stays_check CHECK ((check_out_date > check_in_date)),
    CONSTRAINT stays_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['cash'::character varying, 'card'::character varying, 'bank transfer'::character varying])::text[]))),
    CONSTRAINT stays_security_deposit_check CHECK ((security_deposit >= (0)::numeric)),
    CONSTRAINT stays_status_check CHECK (((status)::text = ANY ((ARRAY['progress'::character varying, 'completed'::character varying, 'canceled'::character varying])::text[])))
);


--
-- Name: stays_persons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stays_persons (
    stay_id character varying(36) NOT NULL,
    person_id character varying(36) NOT NULL
);


--
-- Name: sub_headquarters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sub_headquarters (
    id character varying(36) NOT NULL,
    headquarter_id character varying(36) NOT NULL,
    name character varying(150) NOT NULL,
    address text NOT NULL,
    phone character varying(30) DEFAULT ''::character varying NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_by character varying(100) DEFAULT ''::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by character varying(100),
    deleted_by character varying(100),
    deleted_at timestamp with time zone
);


--
-- Name: user_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_limits (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    limit_key text NOT NULL,
    max_value integer NOT NULL,
    CONSTRAINT user_limits_limit_key_check CHECK ((limit_key ~ '^[a-z_]+$'::text)),
    CONSTRAINT user_limits_max_value_check CHECK ((max_value >= 0))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying(36) NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role_id character varying(36) NOT NULL,
    headquarters_id character varying(36),
    sub_headquarters_id character varying(36),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_by character varying(100) DEFAULT 'user_system'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    all_headquarters boolean DEFAULT false NOT NULL,
    updated_by character varying(100),
    deleted_by character varying(100),
    deleted_at timestamp with time zone
);


--
-- Name: users_headquarters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users_headquarters (
    user_id character varying(36) NOT NULL,
    headquarters_id character varying(36) NOT NULL,
    created_by character varying(100) DEFAULT 'system_bootstrap'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: modules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- Name: permission_resources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_resources ALTER COLUMN id SET DEFAULT nextval('public.permission_resources_id_seq'::regclass);


--
-- Name: resources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resources ALTER COLUMN id SET DEFAULT nextval('public.resources_id_seq'::regclass);


--
-- Data for Name: bed_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bed_types (id, name, capacity_people, description, created_by, created_at, updated_at, headquarters_id, updated_by, deleted_by, deleted_at) FROM stdin;
\.


--
-- Data for Name: beds; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.beds (id, room_id, types_bed_id, etiquette, status, created_by, created_at, updated_at, headquarters_id, updated_by, deleted_by, deleted_at) FROM stdin;
\.


--
-- Data for Name: beds_bed_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.beds_bed_types (bed_id, bed_type_id) FROM stdin;
\.


--
-- Data for Name: buildings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.buildings (id, name, floor_number, headquarters_id, sub_headquarters_id, status, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: headquarters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.headquarters (id, name, address, city, phone, status, created_by, created_at, updated_at, updated_by, deleted_by, deleted_at) FROM stdin;
86e900169e97a28a	Sede Principal Nexora	Calle Principal 123	Bogotá	3001234567	active	bootstrap_seeder	2026-11-23 02:23:00.369096+00	2026-11-23 02:23:00.369096+00	\N	\N	\N
\.


--
-- Data for Name: item_menus; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.item_menus (id, category_id, name, description, price, tax_percentage, prep_time, is_vegetarian, is_vegan, image_url, start_time, end_time, available, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: menu_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.menu_categories (id, headquarters_id, sub_headquarters_id, building_id, name, description, "order", asset, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.modules (id, type_path, type_component, code, sort_order) FROM stdin;
1	/operacion	Operacion	operacion	1
2	/configuracion-hotelera	ConfiguracionHotelera	configuracion_hotelera	2
3	/accesos	Accesos	accesos	3
4	/sistema	Sistema	sistema	4
\.


--
-- Data for Name: palette_colors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.palette_colors (palette_id, hex, name, "position") FROM stdin;
\.


--
-- Data for Name: palettes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.palettes (id, name, is_defined, created_at, headquarters_id, created_by, updated_by, updated_at, deleted_by, deleted_at) FROM stdin;
\.


--
-- Data for Name: permission_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permission_assignments (id, user_id, headquarters_id, sub_headquarters_id, resource_id, permission_resource_id, created_at, updated_at, created_by, updated_by, deleted_by, deleted_at) FROM stdin;
\.


--
-- Data for Name: permission_resources; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permission_resources (id, resource_id, permission, action, description) FROM stdin;
1	1	t	dashboard.view	Acceso al resumen ejecutivo y métricas generales del hotel
2	2	t	reception.manage	Recepción de huéspedes, check-in, asignación de habitación y garantías
3	3	t	checkout_billing.manage	Salida de huéspedes, check-out, cobro de folios y facturación
4	4	t	rooms.operational	Consulta de inventario de habitaciones, disponibilidad y cambio de estado operativo
5	5	t	reserves.manage	Creación, modificación y seguimiento de reservaciones
6	6	t	services.sell_dispatch	Venta de productos en servicios del hotel, room service y cargo a la habitación
7	7	t	persons.manage	Ingreso y actualización de datos de huéspedes, acompañantes y personal
8	8	t	users.manage	Administración de usuarios operadores, credenciales y sedes
9	9	t	permissions.manage	Configuración de roles, recursos y políticas RBAC
10	10	t	profile.view	Consulta del perfil del usuario autenticado
11	11	t	headquarters.manage	Administración de sedes, sub-sedes y edificios del hotel
12	12	t	beds.manage	Configuración de tipos de camas e inventario físico
13	13	t	rates.manage	Creación y configuración comercial de tarifas y planes
14	14	t	audit.view	Auditoría gerencial de habitaciones, tarifas e invariantes
15	15	t	palettes.manage	Personalización de paletas de colores e identidad del hotel
16	16	t	settings.manage	Panel maestro de configuración de módulos y catálogo de productos/categorías
\.


--
-- Data for Name: persons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.persons (id, document_type, document_number, name, phone_number, email, date_of_birth, gender, nationality, created_by, created_at, updated_at, headquarters_id, updated_by, deleted_by, deleted_at) FROM stdin;
\.


--
-- Data for Name: persons_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.persons_roles (person_id, role_id) FROM stdin;
\.


--
-- Data for Name: rates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rates (id, name, headquarter_id, subheadquarter_id, room_type_id, modality, price, duration_units, start_time, end_time, days_of_week, status, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: reserves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reserves (id, room_id, person_id, check_in_date, check_out_date, number_of_guests, state, total_price, headquarters_id, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: reserves_persons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reserves_persons (reserve_id, person_id) FROM stdin;
\.


--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resources (id, component, name, module_id, code, sort_order, show_in_menu) FROM stdin;
1	HomeOverview	Resumen de hoy	1	home	1	t
2	RecepcionesPage	Recepción y Check-in	1	recepcion	2	t
3	SalidasRecepcionesPage	Salidas, Check-out y Facturación	1	salidas	3	t
4	HabitacionesPage	Habitaciones y Asignación	1	habitacion	4	t
5	ReservasPage	Reservas de Habitaciones	1	reservas	5	t
6	ServicioHabitacionesPage	Venta de Productos y Servicios de Habitación	1	servicios	6	t
7	PersonasPage	Directorio de Personas y Huéspedes	3	personas	7	t
8	UsuariosPage	Usuarios del Sistema	3	usuarios	8	t
9	RecursosPage	Asignación de Permisos	3	recursos	9	t
10	UserProfile	Mi Perfil de Usuario	3	perfil	10	f
11	SedesView	Sedes y Sub-sedes	2	sedes	11	t
12	Cama3dPage	Tipos de Camas 3D	2	cama	12	t
13	TarifasPage	Tarifas del Hotel	2	tarifas	13	t
14	AuditoriaPage	Auditoría Operativa y Tarifaria	4	auditoria	14	t
15	PaletteView	Personalización Visual	4	paletas	15	t
16	ConfiguracionesPage	Configuración y Módulos	4	configuracion	16	t
\.


--
-- Data for Name: role_limits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_limits (id, role_id, limit_key, max_value) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, role_id, permission_id, granted_by, granted_at) FROM stdin;
256f4637a7f13ad3	44fbfb97711daed2	1	\N	2026-11-23 03:36:04.161578+00
052d401c4713ce14	7810808c07a39994	1	\N	2026-11-23 03:36:04.164924+00
f80c8d65935b2bb7	8dd63054938e401f	1	\N	2026-11-23 03:36:04.167552+00
ecf2e0dce013aea4	44fbfb97711daed2	2	\N	2026-11-23 03:36:04.175693+00
e28f995b3388bd20	7810808c07a39994	2	\N	2026-11-23 03:36:04.17789+00
ee2f6cea7283de0d	8dd63054938e401f	2	\N	2026-11-23 03:36:04.180193+00
1e04f58aac66875f	934c60ae1d63a49b	2	\N	2026-11-23 03:36:04.182352+00
7df0cdfeae02c374	44fbfb97711daed2	3	\N	2026-11-23 03:36:04.189622+00
64befd03ac497d60	7810808c07a39994	3	\N	2026-11-23 03:36:04.191508+00
852a07da1b8a9e02	8dd63054938e401f	3	\N	2026-11-23 03:36:04.19337+00
6b938ac9aa4c91bf	934c60ae1d63a49b	3	\N	2026-11-23 03:36:04.195173+00
da7cdb78c2a0c163	44fbfb97711daed2	4	\N	2026-11-23 03:36:04.203038+00
f360699ed9d25560	7810808c07a39994	4	\N	2026-11-23 03:36:04.204764+00
a3f4bca97cab2c16	8dd63054938e401f	4	\N	2026-11-23 03:36:04.206457+00
cf49840427aaacc7	934c60ae1d63a49b	4	\N	2026-11-23 03:36:04.208205+00
48e06fbbf6f3157d	44fbfb97711daed2	5	\N	2026-11-23 03:36:04.218351+00
838da6ed8d247116	7810808c07a39994	5	\N	2026-11-23 03:36:04.220403+00
7fd4e7b1f84a9ead	8dd63054938e401f	5	\N	2026-11-23 03:36:04.222615+00
f0ebc9bed9b3e71c	934c60ae1d63a49b	5	\N	2026-11-23 03:36:04.22474+00
6f6faef0e8eb31fc	44fbfb97711daed2	6	\N	2026-11-23 03:36:04.234512+00
0f5330abbc247962	7810808c07a39994	6	\N	2026-11-23 03:36:04.236768+00
b616437dead35e50	8dd63054938e401f	6	\N	2026-11-23 03:36:04.239159+00
7a713223f6abfa3b	934c60ae1d63a49b	6	\N	2026-11-23 03:36:04.241494+00
b0f2d73e82190ddf	44fbfb97711daed2	7	\N	2026-11-23 03:36:04.251171+00
9c9d24cd3ad04fd3	7810808c07a39994	7	\N	2026-11-23 03:36:04.253449+00
cc6d9a9add9af01e	8dd63054938e401f	7	\N	2026-11-23 03:36:04.255725+00
e2256f9df79d887b	934c60ae1d63a49b	7	\N	2026-11-23 03:36:04.258018+00
94d50c0d8dd252ce	44fbfb97711daed2	8	\N	2026-11-23 03:36:04.267388+00
4106e22e92b61fd4	7810808c07a39994	8	\N	2026-11-23 03:36:04.26983+00
da448a5b525fb949	8dd63054938e401f	8	\N	2026-11-23 03:36:04.272035+00
1a536aa343a6f4a1	44fbfb97711daed2	9	\N	2026-11-23 03:36:04.283349+00
7666af240a7096c4	7810808c07a39994	9	\N	2026-11-23 03:36:04.285523+00
852fb9400b4cbb37	8dd63054938e401f	9	\N	2026-11-23 03:36:04.288493+00
0d0ef6bdd2c0913b	44fbfb97711daed2	10	\N	2026-11-23 03:36:04.29908+00
c8921ee0c92bf7e4	7810808c07a39994	10	\N	2026-11-23 03:36:04.301599+00
35f7997d032ef125	8dd63054938e401f	10	\N	2026-11-23 03:36:04.303777+00
1be28b319ed83d0b	934c60ae1d63a49b	10	\N	2026-11-23 03:36:04.306119+00
fbd07085bc7e6a86	44fbfb97711daed2	11	\N	2026-11-23 03:36:04.315786+00
2dae771594f61d81	7810808c07a39994	11	\N	2026-11-23 03:36:04.318195+00
3ae3f78dd6223da0	8dd63054938e401f	11	\N	2026-11-23 03:36:04.320575+00
c8a7ee843389ec51	44fbfb97711daed2	12	\N	2026-11-23 03:36:04.332104+00
b5ef7f740761bf04	7810808c07a39994	12	\N	2026-11-23 03:36:04.334624+00
f912822ed8489fd0	8dd63054938e401f	12	\N	2026-11-23 03:36:04.336707+00
717ef0e62169421b	44fbfb97711daed2	13	\N	2026-11-23 03:36:04.347714+00
57a1115dd2a7a0dd	7810808c07a39994	13	\N	2026-11-23 03:36:04.350421+00
e2b4b785b6b18649	8dd63054938e401f	13	\N	2026-11-23 03:36:04.353148+00
2d6bead688ba3866	44fbfb97711daed2	14	\N	2026-11-23 03:36:04.368057+00
ab19a9b19c6ba6f5	7810808c07a39994	14	\N	2026-11-23 03:36:04.370923+00
ca3ca76ec2fb5942	8dd63054938e401f	14	\N	2026-11-23 03:36:04.373338+00
483f0f2e308fd864	44fbfb97711daed2	15	\N	2026-11-23 03:36:04.387385+00
3d561822c71f48a6	7810808c07a39994	15	\N	2026-11-23 03:36:04.391296+00
5c2ba9bfab28737b	8dd63054938e401f	15	\N	2026-11-23 03:36:04.3935+00
6a969f6211d2e848	44fbfb97711daed2	16	\N	2026-11-23 03:36:04.408663+00
6307c76a695e5e0e	7810808c07a39994	16	\N	2026-11-23 03:36:04.411922+00
3f38bdc92cfb1949	8dd63054938e401f	16	\N	2026-11-23 03:36:04.418673+00
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, description, status, created_by, created_at, updated_by, updated_at, deleted_by, deleted_at) FROM stdin;
44fbfb97711daed2	super_admin	Soporte Técnico / Super Administrador con control de creación de sedes	active	bootstrap_seeder	2026-11-23 02:23:00.348326+00	\N	2026-11-23 02:23:00.348326+00	\N	\N
7810808c07a39994	admin	Administrador / Dueño del Hotel con control de infraestructura y personal	active	bootstrap_seeder	2026-11-23 02:23:00.352017+00	\N	2026-11-23 02:23:00.352017+00	\N	\N
934c60ae1d63a49b	reception	Recepcionista operativo para check-in, check-out y atención de huéspedes	active	bootstrap_seeder	2026-11-23 02:23:00.354724+00	\N	2026-11-23 02:23:00.354724+00	\N	\N
5fd56133de4f0492	housekeeping	Personal de limpieza y camarería	active	bootstrap_seeder	2026-11-23 02:23:00.357393+00	\N	2026-11-23 02:23:00.357393+00	\N	\N
8dd63054938e401f	manager	Supervisor o gerente operativo de sede	active	bootstrap_seeder	2026-11-23 02:23:00.360096+00	\N	2026-11-23 02:23:00.360096+00	\N	\N
c432959b5b800003	guest	Huésped con acceso al portal de servicios	active	bootstrap_seeder	2026-11-23 02:23:00.363317+00	\N	2026-11-23 02:23:00.363317+00	\N	\N
\.


--
-- Data for Name: room_tariffs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.room_tariffs (id, room_id, rate_id, is_default, status, headquarters_id, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: room_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.room_types (id, name, capacity, base_price, created_by, created_at, updated_at, headquarters_id, updated_by, deleted_by, deleted_at) FROM stdin;
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rooms (id, number, floor, room_types_id, building_id, headquarters_id, price_override, status, has_reception, created_by, created_at, updated_at, updated_by, deleted_by, deleted_at) FROM stdin;
\.


--
-- Data for Name: stays; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stays (id, room_id, reservation_id, check_in_date, check_out_date, payment_method, security_deposit, remarks, status, headquarters_id, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: stays_persons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stays_persons (stay_id, person_id) FROM stdin;
\.


--
-- Data for Name: sub_headquarters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sub_headquarters (id, headquarter_id, name, address, phone, status, created_by, created_at, updated_at, updated_by, deleted_by, deleted_at) FROM stdin;
\.


--
-- Data for Name: user_limits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_limits (id, user_id, limit_key, max_value) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password_hash, role_id, headquarters_id, sub_headquarters_id, status, created_by, created_at, updated_at, all_headquarters, updated_by, deleted_by, deleted_at) FROM stdin;
d849af6bfebbe7e2	Soporte Técnico Nexora	soporte@nexora.com	$2a$10$9m8EmxCxnP6g9ypJvZlC7u2L6qUo903lWf7gyJWlbIp0Ak/wUW/NS	44fbfb97711daed2	86e900169e97a28a	\N	active	bootstrap_seeder	2026-11-23 02:23:00.431905+00	2026-11-23 02:23:00.431905+00	t	\N	\N	\N
3565626921633288	Administrador del Hotel	admin@hotel.com	$2a$10$DCS0hbbpbarwYGXJ2SR1J.Yiywdw5YJVJnlcZR.H2UFRf6zwxKmdq	7810808c07a39994	86e900169e97a28a	\N	active	bootstrap_seeder	2026-11-23 02:23:00.500737+00	2026-11-23 02:23:00.500737+00	t	\N	\N	\N
57e7904201db291b	Recepcionista del Hotel	recepcion@hotel.com	$2a$10$.8CKZmNpcZB69UnnniqgU.6TK2tZlCMsgpIyy.DFw1oy2tnQn0ZNW	934c60ae1d63a49b	86e900169e97a28a	\N	active	bootstrap_seeder	2026-11-23 03:36:04.079294+00	2026-11-23 03:36:04.079294+00	f	\N	\N	\N
\.


--
-- Data for Name: users_headquarters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users_headquarters (user_id, headquarters_id, created_by, created_at) FROM stdin;
d849af6bfebbe7e2	86e900169e97a28a	bootstrap_seeder	2026-11-23 02:23:00.436125+00
3565626921633288	86e900169e97a28a	bootstrap_seeder	2026-11-23 02:23:00.504333+00
57e7904201db291b	86e900169e97a28a	bootstrap_seeder	2026-11-23 03:36:04.084033+00
\.


--
-- Name: modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.modules_id_seq', 4, true);


--
-- Name: permission_resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permission_resources_id_seq', 16, true);


--
-- Name: resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.resources_id_seq', 16, true);


--
-- Name: bed_types bed_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bed_types
    ADD CONSTRAINT bed_types_pkey PRIMARY KEY (id);


--
-- Name: beds_bed_types beds_bed_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beds_bed_types
    ADD CONSTRAINT beds_bed_types_pkey PRIMARY KEY (bed_id, bed_type_id);


--
-- Name: beds beds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beds
    ADD CONSTRAINT beds_pkey PRIMARY KEY (id);


--
-- Name: beds beds_room_id_etiquette_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beds
    ADD CONSTRAINT beds_room_id_etiquette_key UNIQUE (room_id, etiquette);


--
-- Name: buildings buildings_headquarters_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_headquarters_id_name_key UNIQUE (headquarters_id, name);


--
-- Name: buildings buildings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_pkey PRIMARY KEY (id);


--
-- Name: headquarters headquarters_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.headquarters
    ADD CONSTRAINT headquarters_name_key UNIQUE (name);


--
-- Name: headquarters headquarters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.headquarters
    ADD CONSTRAINT headquarters_pkey PRIMARY KEY (id);


--
-- Name: item_menus item_menus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_menus
    ADD CONSTRAINT item_menus_pkey PRIMARY KEY (id);


--
-- Name: menu_categories menu_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_categories
    ADD CONSTRAINT menu_categories_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: palette_colors palette_colors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.palette_colors
    ADD CONSTRAINT palette_colors_pkey PRIMARY KEY (palette_id, hex);


--
-- Name: palettes palettes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.palettes
    ADD CONSTRAINT palettes_pkey PRIMARY KEY (id);


--
-- Name: permission_assignments permission_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_assignments
    ADD CONSTRAINT permission_assignments_pkey PRIMARY KEY (id);


--
-- Name: permission_resources permission_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_resources
    ADD CONSTRAINT permission_resources_pkey PRIMARY KEY (id);


--
-- Name: persons persons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persons
    ADD CONSTRAINT persons_pkey PRIMARY KEY (id);


--
-- Name: persons_roles persons_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persons_roles
    ADD CONSTRAINT persons_roles_pkey PRIMARY KEY (person_id, role_id);


--
-- Name: rates rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rates
    ADD CONSTRAINT rates_pkey PRIMARY KEY (id);


--
-- Name: reserves_persons reserves_persons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserves_persons
    ADD CONSTRAINT reserves_persons_pkey PRIMARY KEY (reserve_id, person_id);


--
-- Name: reserves reserves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserves
    ADD CONSTRAINT reserves_pkey PRIMARY KEY (id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: role_limits role_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_limits
    ADD CONSTRAINT role_limits_pkey PRIMARY KEY (role_id, limit_key);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: room_tariffs room_tariffs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_tariffs
    ADD CONSTRAINT room_tariffs_pkey PRIMARY KEY (id);


--
-- Name: room_types room_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_types
    ADD CONSTRAINT room_types_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_building_id_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_building_id_number_key UNIQUE (building_id, number);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: stays_persons stays_persons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stays_persons
    ADD CONSTRAINT stays_persons_pkey PRIMARY KEY (stay_id, person_id);


--
-- Name: stays stays_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stays
    ADD CONSTRAINT stays_pkey PRIMARY KEY (id);


--
-- Name: sub_headquarters sub_headquarters_headquarter_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_headquarters
    ADD CONSTRAINT sub_headquarters_headquarter_id_name_key UNIQUE (headquarter_id, name);


--
-- Name: sub_headquarters sub_headquarters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_headquarters
    ADD CONSTRAINT sub_headquarters_pkey PRIMARY KEY (id);


--
-- Name: permission_resources uq_permission_resources_resource_action; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_resources
    ADD CONSTRAINT uq_permission_resources_resource_action UNIQUE (resource_id, action);


--
-- Name: user_limits user_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_limits
    ADD CONSTRAINT user_limits_pkey PRIMARY KEY (user_id, limit_key);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users_headquarters users_headquarters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_headquarters
    ADD CONSTRAINT users_headquarters_pkey PRIMARY KEY (user_id, headquarters_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_bed_types_hq_name_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_bed_types_hq_name_active ON public.bed_types USING btree (COALESCE(headquarters_id, ''::character varying), lower((name)::text)) WHERE (deleted_at IS NULL);


--
-- Name: idx_item_menus_available; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_menus_available ON public.item_menus USING btree (available);


--
-- Name: idx_item_menus_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_menus_category_id ON public.item_menus USING btree (category_id);


--
-- Name: idx_menu_categories_hq; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_menu_categories_hq ON public.menu_categories USING btree (headquarters_id);


--
-- Name: idx_menu_categories_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_menu_categories_order ON public.menu_categories USING btree ("order");


--
-- Name: idx_palettes_hq_name_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_palettes_hq_name_active ON public.palettes USING btree (COALESCE(headquarters_id, ''::character varying), lower((name)::text)) WHERE (deleted_at IS NULL);


--
-- Name: idx_persons_hq_doc_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_persons_hq_doc_active ON public.persons USING btree (COALESCE(headquarters_id, ''::character varying), document_type, document_number) WHERE (deleted_at IS NULL);


--
-- Name: idx_rates_headquarter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rates_headquarter_id ON public.rates USING btree (headquarter_id);


--
-- Name: idx_rates_modality; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rates_modality ON public.rates USING btree (modality);


--
-- Name: idx_rates_query_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rates_query_lookup ON public.rates USING btree (headquarter_id, subheadquarter_id, room_type_id, modality, status);


--
-- Name: idx_rates_room_type_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rates_room_type_id ON public.rates USING btree (room_type_id);


--
-- Name: idx_rates_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rates_status ON public.rates USING btree (status);


--
-- Name: idx_rates_subheadquarter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rates_subheadquarter_id ON public.rates USING btree (subheadquarter_id);


--
-- Name: idx_reserves_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reserves_dates ON public.reserves USING btree (check_in_date, check_out_date);


--
-- Name: idx_reserves_hq_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reserves_hq_id ON public.reserves USING btree (headquarters_id);


--
-- Name: idx_reserves_person_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reserves_person_id ON public.reserves USING btree (person_id);


--
-- Name: idx_reserves_persons_person_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reserves_persons_person_id ON public.reserves_persons USING btree (person_id);


--
-- Name: idx_reserves_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reserves_room_id ON public.reserves USING btree (room_id);


--
-- Name: idx_reserves_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reserves_state ON public.reserves USING btree (state);


--
-- Name: idx_role_limits_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_limits_role_id ON public.role_limits USING btree (role_id);


--
-- Name: idx_role_permissions_permission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions USING btree (permission_id);


--
-- Name: idx_role_permissions_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_permissions_role_id ON public.role_permissions USING btree (role_id);


--
-- Name: idx_room_tariffs_hq_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_tariffs_hq_id ON public.room_tariffs USING btree (headquarters_id);


--
-- Name: idx_room_tariffs_rate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_tariffs_rate_id ON public.room_tariffs USING btree (rate_id);


--
-- Name: idx_room_tariffs_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_tariffs_room_id ON public.room_tariffs USING btree (room_id);


--
-- Name: idx_room_tariffs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_tariffs_status ON public.room_tariffs USING btree (status);


--
-- Name: idx_room_types_hq_name_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_room_types_hq_name_active ON public.room_types USING btree (COALESCE(headquarters_id, ''::character varying), lower((name)::text)) WHERE (deleted_at IS NULL);


--
-- Name: idx_stays_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stays_dates ON public.stays USING btree (check_in_date, check_out_date);


--
-- Name: idx_stays_hq_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stays_hq_id ON public.stays USING btree (headquarters_id);


--
-- Name: idx_stays_persons_person_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stays_persons_person_id ON public.stays_persons USING btree (person_id);


--
-- Name: idx_stays_reservation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stays_reservation_id ON public.stays USING btree (reservation_id);


--
-- Name: idx_stays_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stays_room_id ON public.stays USING btree (room_id);


--
-- Name: idx_stays_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stays_status ON public.stays USING btree (status);


--
-- Name: idx_user_limits_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_limits_user_id ON public.user_limits USING btree (user_id);


--
-- Name: idx_users_headquarters_hq_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_headquarters_hq_id ON public.users_headquarters USING btree (headquarters_id);


--
-- Name: bed_types bed_types_headquarters_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bed_types
    ADD CONSTRAINT bed_types_headquarters_id_fkey FOREIGN KEY (headquarters_id) REFERENCES public.headquarters(id) ON DELETE CASCADE;


--
-- Name: beds_bed_types beds_bed_types_bed_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beds_bed_types
    ADD CONSTRAINT beds_bed_types_bed_id_fkey FOREIGN KEY (bed_id) REFERENCES public.beds(id) ON DELETE CASCADE;


--
-- Name: beds_bed_types beds_bed_types_bed_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beds_bed_types
    ADD CONSTRAINT beds_bed_types_bed_type_id_fkey FOREIGN KEY (bed_type_id) REFERENCES public.bed_types(id) ON DELETE RESTRICT;


--
-- Name: beds beds_headquarters_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beds
    ADD CONSTRAINT beds_headquarters_id_fkey FOREIGN KEY (headquarters_id) REFERENCES public.headquarters(id) ON DELETE CASCADE;


--
-- Name: beds beds_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beds
    ADD CONSTRAINT beds_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: beds beds_types_bed_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beds
    ADD CONSTRAINT beds_types_bed_id_fkey FOREIGN KEY (types_bed_id) REFERENCES public.bed_types(id) ON DELETE RESTRICT;


--
-- Name: buildings buildings_headquarters_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_headquarters_id_fkey FOREIGN KEY (headquarters_id) REFERENCES public.headquarters(id) ON DELETE CASCADE;


--
-- Name: buildings buildings_sub_headquarters_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_sub_headquarters_id_fkey FOREIGN KEY (sub_headquarters_id) REFERENCES public.sub_headquarters(id) ON DELETE SET NULL;


--
-- Name: palette_colors palette_colors_palette_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.palette_colors
    ADD CONSTRAINT palette_colors_palette_id_fkey FOREIGN KEY (palette_id) REFERENCES public.palettes(id) ON DELETE CASCADE;


--
-- Name: palettes palettes_headquarters_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.palettes
    ADD CONSTRAINT palettes_headquarters_id_fkey FOREIGN KEY (headquarters_id) REFERENCES public.headquarters(id) ON DELETE CASCADE;


--
-- Name: permission_assignments permission_assignments_headquarters_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_assignments
    ADD CONSTRAINT permission_assignments_headquarters_id_fkey FOREIGN KEY (headquarters_id) REFERENCES public.headquarters(id) ON DELETE CASCADE;


--
-- Name: permission_assignments permission_assignments_sub_headquarters_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_assignments
    ADD CONSTRAINT permission_assignments_sub_headquarters_id_fkey FOREIGN KEY (sub_headquarters_id) REFERENCES public.sub_headquarters(id) ON DELETE SET NULL;


--
-- Name: permission_assignments permission_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_assignments
    ADD CONSTRAINT permission_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: permission_resources permission_resources_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_resources
    ADD CONSTRAINT permission_resources_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id) ON DELETE CASCADE;


--
-- Name: persons persons_headquarters_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persons
    ADD CONSTRAINT persons_headquarters_id_fkey FOREIGN KEY (headquarters_id) REFERENCES public.headquarters(id) ON DELETE CASCADE;


--
-- Name: persons_roles persons_roles_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persons_roles
    ADD CONSTRAINT persons_roles_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id) ON DELETE CASCADE;


--
-- Name: persons_roles persons_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persons_roles
    ADD CONSTRAINT persons_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: reserves_persons reserves_persons_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserves_persons
    ADD CONSTRAINT reserves_persons_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id) ON DELETE RESTRICT;


--
-- Name: reserves_persons reserves_persons_reserve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserves_persons
    ADD CONSTRAINT reserves_persons_reserve_id_fkey FOREIGN KEY (reserve_id) REFERENCES public.reserves(id) ON DELETE CASCADE;


--
-- Name: resources resources_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: role_limits role_limits_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_limits
    ADD CONSTRAINT role_limits_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: room_types room_types_headquarters_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_types
    ADD CONSTRAINT room_types_headquarters_id_fkey FOREIGN KEY (headquarters_id) REFERENCES public.headquarters(id) ON DELETE CASCADE;


--
-- Name: rooms rooms_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: rooms rooms_headquarters_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_headquarters_id_fkey FOREIGN KEY (headquarters_id) REFERENCES public.headquarters(id) ON DELETE CASCADE;


--
-- Name: rooms rooms_room_types_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_room_types_id_fkey FOREIGN KEY (room_types_id) REFERENCES public.room_types(id) ON DELETE RESTRICT;


--
-- Name: stays_persons stays_persons_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stays_persons
    ADD CONSTRAINT stays_persons_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id) ON DELETE RESTRICT;


--
-- Name: stays_persons stays_persons_stay_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stays_persons
    ADD CONSTRAINT stays_persons_stay_id_fkey FOREIGN KEY (stay_id) REFERENCES public.stays(id) ON DELETE CASCADE;


--
-- Name: sub_headquarters sub_headquarters_headquarter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_headquarters
    ADD CONSTRAINT sub_headquarters_headquarter_id_fkey FOREIGN KEY (headquarter_id) REFERENCES public.headquarters(id) ON DELETE CASCADE;


--
-- Name: user_limits user_limits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_limits
    ADD CONSTRAINT user_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users_headquarters users_headquarters_headquarters_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_headquarters
    ADD CONSTRAINT users_headquarters_headquarters_id_fkey FOREIGN KEY (headquarters_id) REFERENCES public.headquarters(id) ON DELETE CASCADE;


--
-- Name: users users_headquarters_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_headquarters_id_fkey FOREIGN KEY (headquarters_id) REFERENCES public.headquarters(id) ON DELETE SET NULL;


--
-- Name: users_headquarters users_headquarters_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users_headquarters
    ADD CONSTRAINT users_headquarters_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: users users_sub_headquarters_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_sub_headquarters_id_fkey FOREIGN KEY (sub_headquarters_id) REFERENCES public.sub_headquarters(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict V2KmBsPGb9RMBrdShrpMpVaLzeR3Nr6X8EYmTIwXUuOSod6JdskXfwQJLo41yNp

