"use client";

import React, { useState } from "react";
import { useProduction } from "../../lib/context/ProductionContext";
import { Order, Operation, PriorityLevel } from "../../lib/types/scheduler";
import { detectDependencyCycles } from "../../lib/validation/validator";
import {
  ListOrdered,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  Package,
} from "lucide-react";

export default function OrdersPage() {
  const { orders, addOrder, updateOrder, deleteOrder, generateSchedule } = useProduction();

  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newProdName, setNewProdName] = useState("");
  const [newPriority, setNewPriority] = useState<PriorityLevel>("HIGH");
  const [newQuantity, setNewQuantity] = useState(25);
  const [newDeadline, setNewDeadline] = useState(120);

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newProdName) {
      setValidationError("Customer name and product name are required.");
      return;
    }

    const orderId = `ORD-${Math.floor(100 + Math.random() * 900)}`;
    const newOrd: Order = {
      id: orderId,
      customerName: newCustName,
      productName: newProdName,
      priority: newPriority,
      quantity: Number(newQuantity),
      deadline: Number(newDeadline),
      status: "PENDING",
      createdAtTime: 0,
      operations: [
        {
          id: `OP-${orderId}-1`,
          orderId: orderId,
          name: "Component Assembly",
          sequenceNumber: 1,
          requiredCapability: "Component Assembly",
          processingTime: 20,
          dependencies: [],
          status: "PENDING",
        },
        {
          id: `OP-${orderId}-2`,
          orderId: orderId,
          name: "Soldering",
          sequenceNumber: 2,
          requiredCapability: "Soldering",
          processingTime: 15,
          dependencies: [`OP-${orderId}-1`],
          status: "PENDING",
        },
        {
          id: `OP-${orderId}-3`,
          orderId: orderId,
          name: "Testing",
          sequenceNumber: 3,
          requiredCapability: "Testing",
          processingTime: 12,
          dependencies: [`OP-${orderId}-2`],
          status: "PENDING",
        },
        {
          id: `OP-${orderId}-4`,
          orderId: orderId,
          name: "Quality Inspection",
          sequenceNumber: 4,
          requiredCapability: "Quality Inspection",
          processingTime: 8,
          dependencies: [`OP-${orderId}-3`],
          status: "PENDING",
        },
      ],
    };

    addOrder(newOrd);
    setNewCustName("");
    setNewProdName("");
    setIsAddOrderOpen(false);
    generateSchedule();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100 uppercase tracking-tight">
              Production Orders & DAG Operation Flows
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Define multi-operation manufacturing dependencies with automated cycle detection
          </p>
        </div>

        <button
          onClick={() => setIsAddOrderOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
        >
          <Plus className="h-4 w-4" />
          Add Production Order
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const cycleCheck = detectDependencyCycles(order);
          const totalProcessingTime = order.operations.reduce((sum, op) => sum + op.processingTime, 0);

          return (
            <div
              key={order.id}
              className={`p-5 rounded-2xl border bg-slate-950 shadow-xl transition-all ${
                cycleCheck.hasCycle ? "border-rose-500/80 bg-rose-950/10" : "border-slate-800"
              }`}
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-cyan-400">{order.id}</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{order.productName}</h3>
                    <p className="text-xs text-slate-400">Client: {order.customerName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono uppercase ${
                      order.priority === "CRITICAL"
                        ? "bg-rose-950 text-rose-300 border border-rose-500"
                        : order.priority === "HIGH"
                        ? "bg-amber-950 text-amber-300 border border-amber-500"
                        : order.priority === "MEDIUM"
                        ? "bg-blue-950 text-blue-300 border border-blue-500"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {order.priority}
                  </span>

                  <div className="text-right text-xs font-mono text-slate-400">
                    <div>Deadline: <strong className="text-slate-200">T={order.deadline}m</strong></div>
                    <div className="text-[10px]">Work: {totalProcessingTime}m • Qty: {order.quantity}</div>
                  </div>

                  <button
                    onClick={() => {
                      deleteOrder(order.id);
                      generateSchedule();
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-950/80 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete Order"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Dependency Cycle Warning */}
              {cycleCheck.hasCycle && (
                <div className="mt-3 p-3 rounded-lg bg-rose-950/40 border border-rose-500/80 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-400" />
                  <span>
                    <strong>Invalid operation dependency:</strong> cycle detected in Order {order.id} [
                    {cycleCheck.cyclePath?.join(" -> ")}].
                  </span>
                </div>
              )}

              {/* Operations Chain Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-mono text-[11px]">
                      <th className="py-2 px-3">Seq</th>
                      <th className="py-2 px-3">Operation Name</th>
                      <th className="py-2 px-3">Required Capability</th>
                      <th className="py-2 px-3">Duration</th>
                      <th className="py-2 px-3">Dependencies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono text-slate-300">
                    {order.operations.map((op) => (
                      <tr key={op.id} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 text-slate-400">#{op.sequenceNumber}</td>
                        <td className="py-2 px-3 font-sans font-medium text-slate-200">{op.name}</td>
                        <td className="py-2 px-3 text-cyan-400">{op.requiredCapability}</td>
                        <td className="py-2 px-3">{op.processingTime} min</td>
                        <td className="py-2 px-3 text-amber-300 text-[11px]">
                          {op.dependencies.length > 0 ? op.dependencies.join(", ") : "None (Initial)"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Order Modal */}
      {isAddOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Add New Production Order</h3>
            {validationError && (
              <p className="text-xs text-rose-400 font-semibold">{validationError}</p>
            )}
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer / Client</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Honeywell Process"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Sensor Controller v2"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Deadline (min)</label>
                  <input
                    type="number"
                    min="10"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOrderOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow"
                >
                  Create Order & Regenerate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

