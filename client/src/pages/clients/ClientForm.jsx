import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { clientAPI, invoiceAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Save, ArrowLeft } from 'lucide-react';

const INDIA_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu & Kashmir',
  'Ladakh',
  'Puducherry',
];

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isEdit = !!id;

  const returnTo = location.state?.returnTo;
  const formDraft = location.state?.formDraft;
  const clientDraft = location.state?.clientDraft;

  const [saving, setSaving] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(false);

  const [showSpecialAttention, setShowSpecialAttention] = useState(
    !!clientDraft?.specialAttention?.enabled
  );

  const [form, setForm] = useState({
    name: clientDraft?.name || '',
    email: clientDraft?.email || '',
    phone: clientDraft?.phone || '',
    gstin: clientDraft?.gstin || '',
    pan: clientDraft?.pan || '',
    notes: clientDraft?.notes || '',

    specialAttention: {
      enabled: clientDraft?.specialAttention?.enabled || false,
      label: clientDraft?.specialAttention?.label || 'Kind Attention',
      value: clientDraft?.specialAttention?.value || '',
    },

    address: {
      street: clientDraft?.address?.street || '',
      city: clientDraft?.address?.city || '',
      state: clientDraft?.address?.state || '',
      pincode: clientDraft?.address?.pincode || '',
      country: clientDraft?.address?.country || 'India',
    },
  });

  // ─────────────────────────────────────────────────────────────
  // Check client usage limit when creating a new client
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit) {
      setCheckingLimit(true);

      invoiceAPI
        .getUsage()
        .then((res) => {
          const { clients, clientsLimit, plan } = res.data.usage;

          if (
            clientsLimit !== null &&
            clientsLimit !== undefined &&
            clientsLimit !== Infinity
          ) {
            if (clients >= clientsLimit) {
              toast.error(
                `Your ${plan} plan allows up to ${clientsLimit} clients per month. Upgrade to add more.`,
                {
                  id: 'client-limit-toast',
                }
              );

              navigate('/upgrade');
            }
          }
        })
        .catch((err) => {
          console.error('Failed to load usage limits:', err);
        })
        .finally(() => {
          setCheckingLimit(false);
        });
    }
  }, [isEdit, navigate]);

  // ─────────────────────────────────────────────────────────────
  // Load client when editing
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isEdit) {
      clientAPI
        .getById(id)
        .then((r) => {
          const client = r.data.client;

          setForm({
            name: client?.name || '',
            email: client?.email || '',
            phone: client?.phone || '',
            gstin: client?.gstin || '',
            pan: client?.pan || '',
            notes: client?.notes || '',

            specialAttention: {
              enabled: client?.specialAttention?.enabled || false,
              label:
                client?.specialAttention?.label ||
                'Kind Attention',
              value:
                client?.specialAttention?.value || '',
            },

            address: {
              street: client?.address?.street || '',
              city: client?.address?.city || '',
              state: client?.address?.state || '',
              pincode: client?.address?.pincode || '',
              country:
                client?.address?.country || 'India',
            },
          });

          setShowSpecialAttention(
            !!client?.specialAttention?.enabled
          );
        })
        .catch(() => {
          toast.error('Client not found');
          navigate('/clients');
        });
    } else if (clientDraft) {
      setForm((f) => ({
        ...f,
        ...clientDraft,

        specialAttention: {
          ...f.specialAttention,
          ...(clientDraft.specialAttention || {}),
        },

        address: {
          ...f.address,
          ...(clientDraft.address || {}),
        },
      }));

      setShowSpecialAttention(
        !!clientDraft?.specialAttention?.enabled
      );
    }
  }, [id]);

  // ─────────────────────────────────────────────────────────────
  // Generic field setter
  // ─────────────────────────────────────────────────────────────
  const setField = (key, val) => {
    setForm((f) => ({
      ...f,
      [key]: val,
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // Address field setter
  // ─────────────────────────────────────────────────────────────
  const setAddr = (key, val) => {
    setForm((f) => ({
      ...f,
      address: {
        ...f.address,
        [key]: val,
      },
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // Special attention field setter
  // ─────────────────────────────────────────────────────────────
  const setSpecialAttention = (key, val) => {
    setForm((f) => ({
      ...f,
      specialAttention: {
        ...f.specialAttention,
        [key]: val,
      },
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // Special attention checkbox
  // ─────────────────────────────────────────────────────────────
  const handleSpecialAttentionToggle = (checked) => {
    setShowSpecialAttention(checked);

    setForm((f) => ({
      ...f,
      specialAttention: {
        ...f.specialAttention,
        enabled: checked,

        label:
          f.specialAttention?.label ||
          'Kind Attention',

        value: checked
          ? f.specialAttention?.value || ''
          : '',
      },
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // Go back
  // ─────────────────────────────────────────────────────────────
  const goBack = () =>
    navigate(
      returnTo || '/clients',
      returnTo
        ? {
            state: {
              formDraft,
            },
          }
        : undefined
    );

  // ─────────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client name validation
    if (!form.name?.trim()) {
      return toast.error('Client name is required');
    }

    // Phone validation
    if (
      form.phone &&
      !/^[0-9]{10}$/.test(form.phone)
    ) {
      return toast.error(
        'Phone number must be exactly 10 digits'
      );
    }

    // GSTIN validation
    if (
      form.gstin &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        form.gstin
      )
    ) {
      return toast.error(
        'Invalid GSTIN format (e.g. 29ABCDE1234F1Z5)'
      );
    }

    // PAN validation
    if (
      form.pan &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(
        form.pan
      )
    ) {
      return toast.error(
        'Invalid PAN format (e.g. ABCDE1234F)'
      );
    }

    // Pincode validation
    if (
      form.address?.pincode &&
      !/^[0-9]{6}$/.test(
        form.address.pincode
      )
    ) {
      return toast.error(
        'Pincode must be exactly 6 digits'
      );
    }

    // Special attention validation
    if (
      form.specialAttention?.enabled &&
      !form.specialAttention?.value?.trim()
    ) {
      return toast.error(
        'Please enter the Kind Attention / Special Attention details'
      );
    }

    setSaving(true);

    try {
      // ─────────────────────────────────────────────────────────
      // Prepare clean payload
      // ─────────────────────────────────────────────────────────
      const payload = {
        ...form,

        name: form.name.trim(),

        email: form.email?.trim() || '',

        phone: form.phone?.trim() || '',

        gstin: form.gstin?.trim().toUpperCase() || '',

        pan: form.pan?.trim().toUpperCase() || '',

        specialAttention: {
          enabled:
            !!form.specialAttention?.enabled,

          label:
            form.specialAttention?.label ===
            'Special Attention'
              ? 'Special Attention'
              : 'Kind Attention',

          value:
            form.specialAttention?.enabled
              ? form.specialAttention?.value?.trim() || ''
              : '',
        },

        address: {
          street:
            form.address?.street?.trim() || '',

          city:
            form.address?.city?.trim() || '',

          state:
            form.address?.state || '',

          pincode:
            form.address?.pincode?.trim() || '',

          country:
            form.address?.country || 'India',
        },
      };

      // ─────────────────────────────────────────────────────────
      // Update existing client
      // ─────────────────────────────────────────────────────────
      if (isEdit) {
        await clientAPI.update(id, payload);

        toast.success('Client updated');

        navigate('/clients');
      }

      // ─────────────────────────────────────────────────────────
      // Create new client
      // ─────────────────────────────────────────────────────────
      else {
        const res =
          await clientAPI.create(payload);

        toast.success('Client added');

        if (returnTo) {
          navigate(returnTo, {
            state: {
              newClientId:
                res.data.client._id,

              newClientName:
                res.data.client.name,

              newClient:
                res.data.client,

              formDraft,
            },
          });
        } else {
          navigate('/clients');
        }
      }
    } catch (err) {
      if (
        err.response?.status === 403 &&
        err.response?.data?.code ===
          'PLAN_LIMIT_CLIENTS'
      ) {
        toast.error(
          err.response.data.message,
          {
            id: 'client-limit-toast',
          }
        );

        navigate('/upgrade');

        return;
      }

      toast.error(
        err.response?.data?.message ||
          'Failed to save client'
      );
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────────
  if (checkingLimit) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ─────────────────────────────────────────────────────── */}
      {/* PAGE HEADER */}
      {/* ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div
          className="flex gap-3"
          style={{
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={goBack}
          >
            <ArrowLeft size={16} />
          </button>

          <div>
            <h1 className="page-title">
              {isEdit
                ? 'Edit Client'
                : 'New Client'}
            </h1>

            <p className="page-subtitle">
              {isEdit
                ? 'Update client details'
                : 'Add a new client to your directory'}
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          <Save size={16} />

          {saving
            ? 'Saving…'
            : 'Save Client'}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* BASIC INFO */}
      {/* ─────────────────────────────────────────────────────── */}
      <div className="card mb-4">
        <h2
          className="card-title"
          style={{
            marginBottom: '16px',
          }}
        >
          Basic Info
        </h2>

        <div className="form-grid">
          {/* Client Name */}
          <div className="form-group">
            <label className="form-label">
              Client / Business Name *
            </label>

            <input
              className="form-control"
              value={form.name}
              onChange={(e) =>
                setField(
                  'name',
                  e.target.value
                )
              }
              placeholder="Acme Corp"
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">
              Email
            </label>

            <input
              type="email"
              className="form-control"
              value={form.email}
              onChange={(e) =>
                setField(
                  'email',
                  e.target.value
                )
              }
              placeholder="client@example.com"
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="form-label">
              Phone
            </label>

            <input
              className="form-control"
              value={form.phone}
              onChange={(e) =>
                setField(
                  'phone',
                  e.target.value
                    .replace(
                      /[^0-9]/g,
                      ''
                    )
                    .slice(0, 10)
                )
              }
              placeholder="9876543210"
            />
          </div>

          {/* GSTIN */}
          <div className="form-group">
            <label className="form-label">
              GSTIN
            </label>

            <input
              className="form-control"
              value={form.gstin}
              onChange={(e) =>
                setField(
                  'gstin',
                  e.target.value.toUpperCase()
                )
              }
              placeholder="22AAAAA0000A1Z5"
            />
          </div>

          {/* PAN */}
          <div className="form-group">
            <label className="form-label">
              PAN
            </label>

            <input
              className="form-control"
              value={form.pan}
              onChange={(e) =>
                setField(
                  'pan',
                  e.target.value.toUpperCase()
                )
              }
              placeholder="AAAAA0000A"
            />
          </div>
        </div>

        {/* ───────────────────────────────────────────────────── */}
        {/* SPECIAL ATTENTION */}
        {/* ───────────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop:
              '1px solid var(--border)',
          }}
        >
          {/* Checkbox */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              color:
                'var(--text-primary)',
              width: 'fit-content',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={
                showSpecialAttention
              }
              onChange={(e) =>
                handleSpecialAttentionToggle(
                  e.target.checked
                )
              }
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
                accentColor:
                  'var(--primary)',
                margin: 0,
              }}
            />

            <span>
              Special Attention / Kind Attention
            </span>
          </label>

          {/* Extra box */}
          {showSpecialAttention && (
            <div
              style={{
                marginTop: '12px',
                padding: '16px',
                borderRadius: '8px',
                background:
                  'var(--bg-secondary, #f8fafc)',
                border:
                  '1px solid var(--border)',
              }}
            >
              <div className="form-grid">
                {/* Attention Label */}
                <div className="form-group">
                  <label className="form-label">
                    Attention Label
                  </label>

                  <select
                    className="form-control"
                    value={
                      form.specialAttention
                        ?.label ||
                      'Kind Attention'
                    }
                    onChange={(e) =>
                      setSpecialAttention(
                        'label',
                        e.target.value
                      )
                    }
                  >
                    <option value="Kind Attention">
                      Kind Attention
                    </option>

                    <option value="Special Attention">
                      Special Attention
                    </option>
                  </select>
                </div>

                {/* Attention Details */}
                <div className="form-group">
                  <label className="form-label">
                    Attention Details *
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={
                      form.specialAttention
                        ?.value || ''
                    }
                    onChange={(e) =>
                      setSpecialAttention(
                        'value',
                        e.target.value
                      )
                    }
                    placeholder="e.g. Mr. Rajesh / Accounts Department"
                    maxLength={150}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: '8px',
                  fontSize: '0.78rem',
                  color:
                    'var(--text-secondary)',
                }}
              >
                This information will be saved
                with the client and can be used
                on invoices and quotations.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* ADDRESS */}
      {/* ─────────────────────────────────────────────────────── */}
      <div className="card mb-4">
        <h2
          className="card-title"
          style={{
            marginBottom: '16px',
          }}
        >
          Address
        </h2>

        {/* Street */}
        <div className="form-group">
          <label className="form-label">
            Street / Building
          </label>

          <input
            className="form-control"
            value={
              form.address?.street || ''
            }
            onChange={(e) =>
              setAddr(
                'street',
                e.target.value
              )
            }
            placeholder="123 MG Road"
          />
        </div>

        <div className="form-grid-3">
          {/* City */}
          <div className="form-group">
            <label className="form-label">
              City
            </label>

            <input
              className="form-control"
              value={
                form.address?.city || ''
              }
              onChange={(e) =>
                setAddr(
                  'city',
                  e.target.value
                )
              }
              placeholder="Mumbai"
            />
          </div>

          {/* State */}
          <div className="form-group">
            <label className="form-label">
              State
            </label>

            <select
              className="form-control"
              value={
                form.address?.state || ''
              }
              onChange={(e) =>
                setAddr(
                  'state',
                  e.target.value
                )
              }
            >
              <option value="">
                — Select —
              </option>

              {INDIA_STATES.map(
                (state) => (
                  <option
                    key={state}
                    value={state}
                  >
                    {state}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Pincode */}
          <div className="form-group">
            <label className="form-label">
              Pincode
            </label>

            <input
              className="form-control"
              value={
                form.address?.pincode || ''
              }
              onChange={(e) =>
                setAddr(
                  'pincode',
                  e.target.value
                    .replace(
                      /[^0-9]/g,
                      ''
                    )
                    .slice(0, 6)
                )
              }
              placeholder="400001"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
