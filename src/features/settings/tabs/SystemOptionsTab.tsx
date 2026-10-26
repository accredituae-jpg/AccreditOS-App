import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, FileText, Wallet, FolderHeart, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SystemOptionsTabProps {
  invoiceTypes: any[];
  expenseCategories: any[];
  onAddInvoiceTypeClick: () => void;
  onAddExpenseCategoryClick: () => void;
  onToggleInvoiceType: (id: string, checked: boolean) => void;
  onToggleExpenseCategory: (id: string, checked: boolean) => void;
  onEditInvoiceType: (type: any) => void;
  onEditExpenseCategory: (cat: any) => void;
  canManage?: boolean;
}

export function SystemOptionsTab({
  invoiceTypes,
  expenseCategories,
  onAddInvoiceTypeClick,
  onAddExpenseCategoryClick,
  onToggleInvoiceType,
  onToggleExpenseCategory,
  onEditInvoiceType,
  onEditExpenseCategory,
  canManage = true,
}: SystemOptionsTabProps) {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <Tabs defaultValue="classifications" className="w-full">
        {/* Sub-tab selection bar */}
        <div className="flex justify-start border-b border-border/40 pb-px mb-6 max-w-full overflow-x-auto scrollbar-none touch-pan-x">
          <TabsList className="bg-transparent border-0 h-auto p-0 gap-4 sm:gap-6 max-w-full overflow-x-auto scrollbar-none flex-nowrap shrink-0">
            <TabsTrigger
              value="classifications"
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 pb-3 pt-1 shadow-none transition-all gap-2 text-muted-foreground data-[state=active]:text-foreground font-semibold text-sm shrink-0 whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              Invoice Classifications
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-success data-[state=active]:bg-transparent rounded-none px-1 pb-3 pt-1 shadow-none transition-all gap-2 text-muted-foreground data-[state=active]:text-foreground font-semibold text-sm shrink-0 whitespace-nowrap"
            >
              <Wallet className="w-4 h-4" />
              Expense Categories
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Invoice Classifications Tab Content */}
        <TabsContent value="classifications" className="mt-0 space-y-5 outline-none">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="text-base font-bold text-foreground">
                Billing Classifications
              </h4>
              <p className="text-xs text-muted-foreground">
                Define classification options of services for customer billing.
              </p>
            </div>
            {canManage && (
              <Button onClick={onAddInvoiceTypeClick} className="gap-2 h-9.5 shadow-sm shrink-0 rounded-lg">
                <Plus className="w-4 h-4" />
                Add Classification
              </Button>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {invoiceTypes.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground/60 italic text-sm">
                  No classifications registered. Click "Add Classification" to create one.
                </div>
              ) : (
                invoiceTypes.map((type, idx) => (
                  <motion.div
                    key={type.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                    className="card-elevated border border-border/40 hover:border-primary/30 p-4 flex items-center justify-between gap-4 group transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Tags className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <span className="font-semibold text-foreground/90 text-sm block">
                          {type.name}
                        </span>
                        {type.isActive ? (
                          <Badge variant="outline" className="bg-success/5 text-success border-success/20 px-1.5 py-px text-[9px] font-bold">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border px-1.5 py-px text-[9px] font-bold">Inactive</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={type.isActive}
                        onCheckedChange={(checked) => onToggleInvoiceType(type.id, checked)}
                        disabled={!canManage}
                        className="data-[state=checked]:bg-success scale-90"
                      />
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg"
                          onClick={() => onEditInvoiceType(type)}
                          title="Edit Classification"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </TabsContent>

        {/* Expense Categories Tab Content */}
        <TabsContent value="categories" className="mt-0 space-y-5 outline-none">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="text-base font-bold text-foreground">
                Expense Categories
              </h4>
              <p className="text-xs text-muted-foreground">
                Configure outgoing categories to organize bookkeeping ledger items.
              </p>
            </div>
            {canManage && (
              <Button onClick={onAddExpenseCategoryClick} className="gap-2 h-9.5 shadow-sm shrink-0 bg-success hover:bg-success/90 text-success-foreground rounded-lg">
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {expenseCategories.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground/60 italic text-sm">
                  No expense categories registered. Click "Add Category" to create one.
                </div>
              ) : (
                expenseCategories.map((cat, idx) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                    className="card-elevated border border-border/40 hover:border-success/30 p-4 flex items-center justify-between gap-4 group transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-success/10 text-success rounded-xl shrink-0 group-hover:bg-success/20 transition-colors">
                        <FolderHeart className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <span className="font-semibold text-foreground/90 text-sm block">
                          {cat.name}
                        </span>
                        {cat.isActive ? (
                          <Badge variant="outline" className="bg-success/5 text-success border-success/20 px-1.5 py-px text-[9px] font-bold">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border px-1.5 py-px text-[9px] font-bold">Inactive</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={cat.isActive}
                        onCheckedChange={(checked) => onToggleExpenseCategory(cat.id, checked)}
                        disabled={!canManage}
                        className="data-[state=checked]:bg-success scale-90"
                      />
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg"
                          onClick={() => onEditExpenseCategory(cat)}
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
export default SystemOptionsTab;
